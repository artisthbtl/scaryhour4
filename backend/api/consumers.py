import json
import asyncio
import docker
import select
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import LabSession

class TerminalConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.guide_steps = []
        self.current_step_index = 0
        self.command_buffer = ""

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.user = self.scope['user']
        self.lab_session = await self.get_lab_session()
        if self.lab_session is None or self.lab_session.kali_container_id is None:
            await self.close()
            return
        await self.accept()
        try:
            await self.attach_to_container()
            self.guide_steps = await self.get_guide_steps()
            initial_steps = []
            for i, step in enumerate(self.guide_steps):
                if not step.get('trigger_command'):
                    initial_steps.append(step)
                    self.current_step_index = i + 1
                else:
                    break
            if initial_steps:
                await self.send(text_data=json.dumps({'type': 'show_guide', 'steps': initial_steps}))
            self.ping_task = asyncio.create_task(self.send_ping())
            asyncio.create_task(self.read_docker_output())
        except Exception as e:
            await self.send(text_data=json.dumps({'error': f"Failed to attach to lab environment: {str(e)}"}))
            await self.close()

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        message_type = data.get('type')

        if not (hasattr(self, 'pty_socket') and self.pty_socket):
            return

        if message_type == 'pong':
            return
        elif message_type == 'resize':
            cols = data.get('cols')
            rows = data.get('rows')
            if cols and rows and hasattr(self, 'exec_id'):
                await asyncio.to_thread(self.docker_client.api.exec_resize, self.exec_id, height=rows, width=cols)
        
        elif message_type == 'input_with_command':
            command_line = data.get('command', '')
            
            import re
            prompt_pattern = r"^(.*[\$#]\s)"
            command = re.sub(prompt_pattern, "", command_line).strip()

            print(f"User submitted command: '{command}'")

            if self.current_step_index < len(self.guide_steps):
                next_step = self.guide_steps[self.current_step_index]
                if command == next_step.get('trigger_command'):
                    print(f"SUCCESS: Trigger command matched!")
                    steps_to_send = []
                    for i in range(self.current_step_index, len(self.guide_steps)):
                        step = self.guide_steps[i]
                        steps_to_send.append(step)
                        self.current_step_index = i + 1
                        is_last_step = (i + 1) >= len(self.guide_steps)
                        if not is_last_step and self.guide_steps[i+1].get('trigger_command'):
                            break
                    await self.send(text_data=json.dumps({'type': 'show_guide', 'steps': steps_to_send}))
            
            input_data = data.get('input', '')
            await asyncio.to_thread(self.pty_socket._sock.sendall, input_data.encode())

        elif message_type == 'input':
            input_data = data.get('input', '')
            await asyncio.to_thread(self.pty_socket._sock.sendall, input_data.encode())
            
    @database_sync_to_async
    def get_lab_session(self):
        try:
            session = LabSession.objects.get(id=self.session_id)
            if session.user != self.user: return None
            return session
        except LabSession.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_guide_steps(self):
        if self.lab_session and self.lab_session.material:
            return list(self.lab_session.material.guide_steps.all().values('step_number', 'content', 'trigger_command'))
        return []
    
    async def attach_to_container(self):
        def _attach():
            self.docker_client = docker.from_env()
            container_id = self.lab_session.kali_container_id
            self.container = self.docker_client.containers.get(container_id)
            exec_instance = self.docker_client.api.exec_create(self.container.id, '/bin/bash', stdin=True, tty=True, user='student')
            self.exec_id = exec_instance['Id']
            self.pty_socket = self.docker_client.api.exec_start(self.exec_id, socket=True, tty=True)
        await asyncio.to_thread(_attach)
    
    async def disconnect(self, close_code):
        if hasattr(self, 'ping_task'): self.ping_task.cancel()
        def _cleanup():
            try:
                if hasattr(self, 'container') and self.container: self.docker_client.containers.get(self.container.id).remove(force=True)
                if hasattr(self, 'lab_session') and self.lab_session: self.lab_session.delete()
            except Exception as e:
                print(f"Error during cleanup for session {self.session_id}: {e}")
        if hasattr(self, 'docker_client'): await asyncio.to_thread(_cleanup)
    
    async def read_docker_output(self):
        while True:
            try:
                readable, _, _ = await asyncio.to_thread(select.select, [self.pty_socket._sock], [], [], 0.2)
                if readable:
                    output = self.pty_socket._sock.recv(1024)
                    if not output: break
                    await self.send(text_data=json.dumps({'type': 'output', 'output': output.decode(errors='ignore')}))
            except Exception:
                break
        await self.close()
    
    async def send_ping(self):
        while True:
            await asyncio.sleep(20)
            await self.send(text_data=json.dumps({'type': 'ping'}))