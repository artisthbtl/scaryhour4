import asyncio
import json
import os
import pty
import threading
import subprocess
import fcntl
import struct
import termios
import shlex
import select
import signal

from channels.generic.websocket import WebsocketConsumer

def set_winsize(fd, row, col, xpix=0, ypix=0):
    winsize = struct.pack("HHHH", row, col, xpix, ypix)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)

class TerminalConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.master_fd = None
        self.child_pid = None
        self.read_thread = None
        self.shell_command = ['/bin/bash']
        self.is_pty_running = False

    def connect(self):
        self.accept()

        if self.master_fd is not None:
            self.send_error("Terminal session already active.")
            self.close()
            return

        try:
            child_pid, master_fd = pty.fork()
        except Exception as e:
            self.send_error(f"Failed to fork PTY: {str(e)}")
            self.close()
            return

        if child_pid == 0:
            try:
                env = os.environ.copy()
                env['TERM'] = 'xterm'
                os.execvpe(self.shell_command[0], self.shell_command, env)
            except Exception as e:
                print(f"Child process execvpe failed: {e}")
                os._exit(1)
        else:
            self.child_pid = child_pid
            self.master_fd = master_fd
            self.is_pty_running = True

            try:
                set_winsize(self.master_fd, 24, 80)

                self.read_thread = threading.Thread(target=self._forward_pty_output)
                self.read_thread.daemon = True
                self.read_thread.start()

                self.send(text_data=json.dumps({
                    "type": "status",
                    "message": "Welcome to the terminal."
                }))
                print(f"PTY session started for connection. PID: {self.child_pid}, FD: {self.master_fd}")

            except Exception as e:
                self.send_error(f"Error during PTY setup: {str(e)}")
                self._cleanup_pty()
                self.close()


    def disconnect(self, close_code):
        print(f"WebSocket disconnected with code: {close_code}")
        self._cleanup_pty()

    def receive(self, text_data):
        if not self.is_pty_running or self.master_fd is None:
            self.send_error("PTY not running.")
            return

        try:
            payload = json.loads(text_data)
            action_type = payload.get("type")

            if action_type == "input":
                input_data = payload.get("input")
                if input_data:
                    os.write(self.master_fd, input_data.encode())
            elif action_type == "resize":
                rows = payload.get("rows")
                cols = payload.get("cols")
                if rows and cols:
                    set_winsize(self.master_fd, rows, cols)
            else:
                self.send_error(f"Unknown action type: {action_type}")

        except json.JSONDecodeError:
            self.send_error("Invalid JSON received.")
        except OSError as e:
            if self.is_pty_running: 
                self.send_error(f"PTY OS Error: {str(e)}")
            self._cleanup_pty() 
            self.close()
        except Exception as e:
            self.send_error(f"Error processing message: {str(e)}")


    def _forward_pty_output(self):
        max_read_bytes = 1024 * 20
        while self.is_pty_running and self.master_fd is not None:
            try:
                ready, _, _ = select.select([self.master_fd], [], [], 0.1)
                if not ready:
                    continue 

                output = os.read(self.master_fd, max_read_bytes)
                if output:
                    try:
                        decoded_output = output.decode(errors="replace") 
                        self.send(text_data=json.dumps({"output": decoded_output}))
                    except Exception as e:
                        print(f"Error decoding/sending PTY output: {e}")
                else: 
                    print("PTY output stream ended (0 bytes read). Shell likely exited.")
                    self.send(text_data=json.dumps({
                        "type": "status",
                        "message": "Terminal session ended."
                    }))
                    break 
            except OSError as e:
                print(f"PTY read error in thread: {e}")
                break 
            except Exception as e:
                print(f"Unexpected error in PTY read thread: {e}")
                break 
        
        print("PTY output forwarding thread finished.")
        self.is_pty_running = False

    def _cleanup_pty(self):
        if not self.is_pty_running and self.master_fd is None and self.child_pid is None:
            return 

        print("Cleaning up PTY resources...")
        self.is_pty_running = False 

        if self.master_fd is not None:
            try:
                print(f"Closing master PTY FD: {self.master_fd}")
                os.close(self.master_fd)
            except OSError as e:
                print(f"Error closing master PTY FD {self.master_fd}: {e}")
            finally:
                self.master_fd = None

        if self.read_thread and self.read_thread.is_alive():
            print("Waiting for PTY read thread to join...")
            self.read_thread.join(timeout=1.0) 
            if self.read_thread.is_alive():
                print("PTY read thread did not join in time.")
        self.read_thread = None

        if self.child_pid is not None:
            try:
                print(f"Terminating child process PID: {self.child_pid}")
                os.kill(self.child_pid, signal.SIGKILL) 
                os.waitpid(self.child_pid, 0) 
            except ProcessLookupError:
                print(f"Child process {self.child_pid} already exited.")
            except OSError as e:
                print(f"Error terminating/waiting for child process {self.child_pid}: {e}")
            finally:
                self.child_pid = None
        print("PTY cleanup complete.")

    def send_error(self, message):
        print(f"Sending error to client: {message}")
        self.send(text_data=json.dumps({"error": message}))