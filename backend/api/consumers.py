import json
import asyncio
import docker
import select
from channels.generic.websocket import AsyncWebsocketConsumer

class TerminalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("WebSocket connection accepted.")
        try:
            await self.start_docker_container()
            self.ping_task = asyncio.create_task(self.send_ping())

            asyncio.create_task(self.read_docker_output())
            
            await self.send(text_data=json.dumps({
                'type': 'status'
            }))
        except Exception as e:
            print(f"Error starting Docker container: {e}")
            await self.send(text_data=json.dumps({'error': f"Failed to start container: {str(e)}"}))
            await self.close()

    async def start_docker_container(self):
        def _start_container():
            self.docker_client = docker.from_env()
            sanitized_channel_name = self.channel_name.replace('.', '-').replace('!', '-')
            container_name = f"scaryhour4-kali-{sanitized_channel_name}"
            
            print(f"Starting container: {container_name}")
            try:
                existing_container = self.docker_client.containers.get(container_name)
                existing_container.remove(force=True)
            except docker.errors.NotFound:
                pass

            self.container = self.docker_client.containers.run(
                'scaryhour-kali',
                name=container_name,
                detach=True,
                tty=True,
                stdin_open=True,
            )

            exec_instance = self.docker_client.api.exec_create(
                self.container.id, '/bin/bash', stdin=True, tty=True
            )
            self.exec_id = exec_instance['Id']

            self.pty_socket = self.docker_client.api.exec_start(
                self.exec_id, socket=True, tty=True
            )
            print(f"Container {self.container.short_id} started with bash shell exec_id: {self.exec_id[:12]}")

        await asyncio.to_thread(_start_container)


    async def disconnect(self, close_code):
        print(f"WebSocket disconnected. Cleaning up container for channel: {self.channel_name}")

        if hasattr(self, 'ping_task'):
            self.ping_task.cancel()
        
        def _cleanup():
            try:
                if hasattr(self, 'container') and self.container:
                    container_to_remove = self.docker_client.containers.get(self.container.id)
                    container_to_remove.remove(force=True)
            except Exception as e:
                print(f"Error during cleanup: {e}")

        if hasattr(self, 'docker_client'):
            await asyncio.to_thread(_cleanup)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'pong':
            print("Received pong from client.")
            return
            
        if not (hasattr(self, 'pty_socket') and self.pty_socket):
            return

        if message_type == 'input':
            input_data = data.get('input', '')
            await asyncio.to_thread(self.pty_socket._sock.sendall, input_data.encode())
        elif message_type == 'resize':
            cols = data.get('cols')
            rows = data.get('rows')
            if cols and rows and hasattr(self, 'exec_id'):
                await asyncio.to_thread(self.docker_client.api.exec_resize, self.exec_id, height=rows, width=cols)
        else:
            print(f"Unknown message type received: {message_type}")
    
    async def read_docker_output(self):
        while True:
            try:
                readable, _, _ = await asyncio.to_thread(
                    select.select, [self.pty_socket._sock], [], [], 0.2
                )
                
                if readable:
                    output = self.pty_socket._sock.recv(1024)
                    if not output:
                        print("PTY socket stream ended.")
                        break
                    
                    await self.send(text_data=json.dumps({
                        'type': 'output',
                        'output': output.decode(errors='ignore')
                    }))

            except Exception as e:
                print(f"Error reading from PTY socket: {e}")
                await self.send(text_data=json.dumps({'error': f"Connection to terminal lost: {str(e)}"}))
                break
        await self.close()

    async def send_ping(self):
        while True:
            await asyncio.sleep(20)
            print("Sending ping to client.")
            await self.send(text_data=json.dumps({'type': 'ping'}))