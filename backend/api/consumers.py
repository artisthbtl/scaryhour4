import json
import asyncio
import docker
import select
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import LabSession

class TerminalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.user = self.scope['user']

        self.lab_session = await self.get_lab_session()
        if self.lab_session is None or self.lab_session.kali_container_id is None:
            print(f"Invalid session ID or unauthorized user for session {self.session_id}")
            await self.close()
            return

        await self.accept()
        print(f"WebSocket connection accepted for session: {self.session_id}")

        try:
            await self.attach_to_container()
            self.ping_task = asyncio.create_task(self.send_ping())
            asyncio.create_task(self.read_docker_output())
        except Exception as e:
            print(f"Error attaching to Docker container: {e}")
            await self.send(text_data=json.dumps({'error': f"Failed to attach to lab environment: {str(e)}"}))
            await self.close()

    @database_sync_to_async
    def get_lab_session(self):
        try:
            session = LabSession.objects.get(id=self.session_id)
            if session.user != self.user:
                return None
            return session
        except LabSession.DoesNotExist:
            return None

    async def attach_to_container(self):
        def _attach():
            self.docker_client = docker.from_env()
            container_id = self.lab_session.kali_container_id
            print(f"Attaching to container: {container_id}")
            self.container = self.docker_client.containers.get(container_id)

            exec_instance = self.docker_client.api.exec_create(
                self.container.id, '/bin/bash', stdin=True, tty=True, user='student'
            )
            self.exec_id = exec_instance['Id']
            self.pty_socket = self.docker_client.api.exec_start(
                self.exec_id, socket=True, tty=True
            )
            print(f"Attached to shell in container {self.container.short_id}")

        await asyncio.to_thread(_attach)

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected for session: {self.session_id}. Cleaning up.")
        if hasattr(self, 'ping_task'):
            self.ping_task.cancel()
        def _cleanup():
            print(f"Cleaning up resources for session {self.session_id}")
            try:
                client = self.docker_client

                if self.lab_session.kali_container_id:
                    try:
                        kali_container = client.containers.get(self.lab_session.kali_container_id)
                        kali_container.remove(force=True)
                        print(f"Removed Kali container: {self.lab_session.kali_container_id[:12]}")
                    except docker.errors.NotFound:
                        print("Kali container not found, may have already been removed.")
                
                if self.lab_session.target_container_id:
                    try:
                        target_container = client.containers.get(self.lab_session.target_container_id)
                        target_container.remove(force=True)
                        print(f"Removed Target container: {self.lab_session.target_container_id[:12]}")
                    except docker.errors.NotFound:
                        print("Target container not found.")
                
                if self.lab_session.network_id:
                    try:
                        network = client.networks.get(self.lab_session.network_id)
                        network.remove()
                        print(f"Removed network: {self.lab_session.network_id[:12]}")
                    except docker.errors.NotFound:
                        print("Network not found.")

                self.lab_session.delete()
                print("LabSession record deleted.")
            except Exception as e:
                print(f"An error occurred during cleanup for session {self.session_id}: {e}")
        if hasattr(self, 'docker_client'):
            await asyncio.to_thread(_cleanup)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        message_type = data.get('type')
        if message_type == 'pong':
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
    
    async def read_docker_output(self):
        while True:
            try:
                readable, _, _ = await asyncio.to_thread(select.select, [self.pty_socket._sock], [], [], 0.2)
                if readable:
                    output = self.pty_socket._sock.recv(1024)
                    if not output: break
                    await self.send(text_data=json.dumps({'type': 'output', 'output': output.decode(errors='ignore')}))
            except Exception as e:
                break
        await self.close()

    async def send_ping(self):
        while True:
            await asyncio.sleep(20)
            await self.send(text_data=json.dumps({'type': 'ping'}))