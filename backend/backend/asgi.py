import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_asgi_application()

application = ProtocolTypeRouter({
    'http': application,

    'websocket': AuthMiddlewareStack( # AuthMiddlewareStack handles user authentication
        URLRouter(
        )
    ),
})