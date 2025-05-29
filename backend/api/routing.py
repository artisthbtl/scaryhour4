from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    path('ws/terminal/', consumers.TerminalConsumer.as_asgi()),
]