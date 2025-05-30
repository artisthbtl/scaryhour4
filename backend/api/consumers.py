import json
import os
import pty
import subprocess 
import threading
import fcntl 
from channels.generic.websocket import WebsocketConsumer

class TerminalConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.master_fd = None
        self.child_pid = None
        self.read_thread = None
        self.shell_command = ['/bin/bash'] 

    def connect(self):
        print("WebSocket connection attempt...")
        self.accept()
        print("WebSocket connection accepted.")
        pid, fd = pty.fork()

        if pid == 0:  
            print(f"Child PTY process (PID: {os.getpid()}) executing shell: {self.shell_command}")
            env = os.environ.copy()
            env['SHELL'] = self.shell_command[0]
            env['TERM'] = 'xterm' 
            try:
                os.execvpe(self.shell_command[0], self.shell_command, env)
            except OSError as e:
                print(f"Child process: Failed to execute shell: {e}")
                os._exit(1) 
        else:  
            self.child_pid = pid
            self.master_fd = fd
            print(f"Parent process: PTY spawned. Child PID: {self.child_pid}, Master FD: {self.master_fd}")
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
                print("PTY read thread: >>> Calling os.read()...")  
                try:
                    output = os.read(self.master_fd, 1024)
                except OSError as e:
                    print(f"PTY read thread: OSError during os.read(): {e}") 
                    break 
                print(f"PTY read thread: <<< os.read() returned {len(output)} bytes.")  

                if output:
                    print(f"PTY read thread: Raw data read: {repr(output)}")  
                    try:
                        decoded_output = output.decode()
                        print(f"PTY read thread: Decoded data: {repr(decoded_output)}")  
                        self.send(text_data=json.dumps({'output': decoded_output}))
                    except UnicodeDecodeError:
                        print(f"PTY read thread: UnicodeDecodeError with data: {output}")
                else:
                    print("PTY read thread: PTY stream ended (read 0 bytes).")
                    self.send(text_data=json.dumps({'message': 'Terminal session ended.'}))
                    
                    self.close() 
                    break 
        except Exception as e: 
            print(f"PTY read thread: An unexpected critical error occurred: {e}")
        finally:
            print("PTY read thread: Exiting.")

    def close_websocket_if_pty_closed(self):
        print("PTY read thread: Signaling main consumer to close WebSocket (or it will be done on next client/server action).")
        
    def receive(self, text_data=None, bytes_data=None):
        print(f"Received message from client (repr): {repr(text_data)}")
        if self.master_fd and text_data:
            command_to_send = text_data
            if not command_to_send.endswith('\n'):
                command_to_send += '\n'  

            print(f"Writing to PTY (repr): {repr(command_to_send)}") 
            try:
                os.write(self.master_fd, command_to_send.encode())
            except OSError as e:
                print(f"Error writing to PTY: {e}")
                self.send(text_data=json.dumps({'error': 'Failed to write to terminal.'}))
            except Exception as e:
                print(f"Unexpected error writing to PTY: {e}")
            
    def disconnect(self, close_code):
        print(f"WebSocket disconnected with close_code: {close_code}")
        
        if self.master_fd:
            print(f"Closing master_fd: {self.master_fd}")
            try:
                os.close(self.master_fd)
                self.master_fd = None 
            except OSError as e:
                print(f"Error closing master_fd: {e}")

        if self.child_pid:
            print(f"Terminating child process PID: {self.child_pid}")
            try:        
                os.kill(self.child_pid, 9) 
            except ProcessLookupError:
                print(f"Child process {self.child_pid} already exited.")
            except OSError as e:
                print(f"Error killing child process {self.child_pid}: {e}")
            self.child_pid = None 

        if self.read_thread and self.read_thread.is_alive():
            print("Waiting for PTY read thread to join...")
            self.read_thread.join(timeout=2.0)
            if self.read_thread.is_alive():
                print("PTY read thread did not join in time.")
            else:
                print("PTY read thread joined successfully.")
        
        self.read_thread = None
        print("TerminalConsumer disconnected and cleaned up.")