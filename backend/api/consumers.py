import json
import asyncio
import docker
from channels.generic.websocket import AsyncWebsocketConsumer

class TerminalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("WebSocket connection accepted.")
        try:
            await self.start_docker_container()
            asyncio.create_task(self.read_docker_output())
            await self.send(text_data=json.dumps({
                'type': 'status',
                'message': 'Kali Linux container started successfully! Welcome.'
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
                self.container.id,
                '/bin/bash',
                stdin=True,
                stdout=True,
                stderr=True,
                tty=True
            )
            self.exec_id = exec_instance['Id']

            self.pty_socket = self.docker_client.api.exec_start(
                self.exec_id,
                socket=True,
                tty=True
            )
            # --- END OF NEW LOGIC ---
            print(f"Container {self.container.short_id} started with bash shell exec_id: {self.exec_id[:12]}")

        await asyncio.to_thread(_start_container)

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected. Cleaning up container for channel: {self.channel_name}")
        def _cleanup():
            try:
                if hasattr(self, 'container') and self.container:
                    container_to_remove = self.docker_client.containers.get(self.container.id)
                    print(f"Stopping and removing container: {container_to_remove.short_id}")
                    container_to_remove.remove(force=True)
                    print("Container removed.")
            except Exception as e:
                print(f"Error during cleanup: {e}")

        if hasattr(self, 'docker_client'):
            await asyncio.to_thread(_cleanup)

    async def receive(self, text_data=None, bytes_data=None):
        if not (hasattr(self, 'pty_socket') and self.pty_socket):
            return

        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'input':
                input_data = data.get('input', '')
                await asyncio.to_thread(self.pty_socket._sock.sendall, input_data.encode())

            elif message_type == 'resize':
                cols = data.get('cols')
                rows = data.get('rows')
                if cols and rows and hasattr(self, 'exec_id'):
                    print(f"Resizing exec PTY {self.exec_id[:12]} to {cols}x{rows}")
                    await asyncio.to_thread(self.docker_client.api.exec_resize, self.exec_id, height=rows, width=cols)
            else:
                print(f"Unknown message type received: {message_type}")

        except Exception as e:
            print(f"Error in receive method: {e}")

    async def read_docker_output(self):
        while True:
            try:
                output = await asyncio.to_thread(self.pty_socket._sock.recv, 1024)
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