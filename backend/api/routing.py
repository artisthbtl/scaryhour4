from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    path('ws/terminal/<uuid:session_id>/', consumers.TerminalConsumer.as_asgi()),
]