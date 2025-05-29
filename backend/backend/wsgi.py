import os
print("!!! WSGI.PY IS BEING LOADED NOW !!!")
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()
