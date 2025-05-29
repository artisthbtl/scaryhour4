import json
from channels.generic.websocket import WebsocketConsumer

class TerminalConsumer(WebsocketConsumer):
    def connect(self):
        print("WebSocket connection attempt...")
        self.accept()
        print("WebSocket connection accepted.")
        self.send(text_data=json.dumps({
            'message': 'Connection established successfully! Welcome to the terminal.'
        }))

    def disconnect(self, close_code):
        print(f"WebSocket disconnected with close_code: {close_code}")
        pass

    def receive(self, text_data=None, bytes_data=None):
        print(f"Received message from client: {text_data}")
        
        self.send(text_data=json.dumps({
            'type': 'echo',
            'message': f"Server received: {text_data}" 
        }))
        if text_data.strip() == "ls":
            self.send(text_data=json.dumps({'output': 'file1.txt directoryA another_file.sh'}))
        elif text_data.strip() == "pwd":
            self.send(text_data=json.dumps({'output': '/fake/home/user'}))
        elif text_data:
             self.send(text_data=json.dumps({'output': f'{text_data}: command not found (simulated)'}))