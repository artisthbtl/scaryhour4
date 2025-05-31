import json
import os
import pty
import threading
import termios

from channels.generic.websocket import WebsocketConsumer

class TerminalConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.master_fd = None
        self.child_pid = None
        self.read_thread = None
        self.shell_command = ['/bin/bash']

    def connect(self):
        self.accept()
        pid, fd = pty.fork()

        if pid == 0:
            env = os.environ.copy()
            env['SHELL'] = self.shell_command[0]
            env['TERM'] = 'xterm'
            try:
                os.execvpe(self.shell_command[0], self.shell_command, env)
            except OSError as e:
                print(f"Child PTY process: execvpe failed: {e}")
                os._exit(1)
        else:
            self.child_pid = pid
            self.master_fd = fd
            print(f"Parent process: PTY spawned. Child PID: {self.child_pid}, Master FD: {self.master_fd}")

            try:
                attrs = termios.tcgetattr(self.master_fd)
                attrs[3] &= ~termios.ECHO
                termios.tcsetattr(self.master_fd, termios.TCSADRAIN, attrs)
                print("PTY echo disabled.")
            except termios.error as e:
                print(f"Error setting PTY attributes: {e}. PTY might still echo input.")

            self.read_thread = threading.Thread(target=self.read_from_pty)
            self.read_thread.daemon = True
            self.read_thread.start()
            print("PTY read thread started.")
            self.send(text_data=json.dumps({
                'message': 'Connection established successfully! Welcome to the terminal.'
            }))

    def read_from_pty(self):
        print("PTY read thread: Listening for output...")
        try:
            while True:
                try:
                    output = os.read(self.master_fd, 1024)
                except OSError as e:
                    print(f"PTY read thread: OSError during os.read(): {e}")
                    break

                if output:
                    try:
                        decoded_output = output.decode()
                        print(f"PTY read thread: Decoded data: {repr(decoded_output)}")
                        self.send(text_data=json.dumps({'output': decoded_output}))
                    except UnicodeDecodeError:
                        print(f"PTY read thread: UnicodeDecodeError with data: {output}")
                else:
                    print("PTY read thread: PTY child process exited (0 bytes read).")
                    self.close()
                    break
        except Exception as e:
            print(f"PTY read thread: An unexpected critical error occurred: {e}")
        finally:
            print("PTY read thread: Exiting.")
            if self.connected:
                 try:
                     self.close(code=1011)
                 except Exception:
                     pass

    def receive(self, text_data=None, bytes_data=None):
        if self.master_fd is not None and text_data:
            data_to_pty = text_data

            print(f"Writing to PTY (repr): {repr(data_to_pty)}")
            try:
                os.write(self.master_fd, data_to_pty.encode())
            except OSError as e:
                print(f"OSError writing to PTY: {e}")
            except Exception as e:
                print(f"Unexpected error writing to PTY: {e}")
        elif self.master_fd is None:
            print("Receive called but PTY master_fd is None (session likely ended or not started).")


    def disconnect(self, close_code):
        print(f"WebSocket disconnected with close_code: {close_code}")

        if self.master_fd is not None:
            print(f"Closing master_fd: {self.master_fd}")
            try:
                os.close(self.master_fd)
            except OSError as e:
                print(f"Error closing master_fd: {e}")
            finally:
                self.master_fd = None

        if self.child_pid is not None:
            print(f"Terminating child process PID: {self.child_pid}")
            try:
                os.kill(self.child_pid, 9)
            except ProcessLookupError:
                print(f"Child process {self.child_pid} already exited.")
            except OSError as e:
                print(f"Error killing child process {self.child_pid}: {e}")
            finally:
                self.child_pid = None

        if self.read_thread and self.read_thread.is_alive():
            print("Waiting for PTY read thread to join...")
            self.read_thread.join(timeout=1.0)
            if self.read_thread.is_alive():
                print("PTY read thread did not join in time.")
        self.read_thread = None
        print("TerminalConsumer cleanup complete on disconnect.")