from django.contrib import admin
from django.contrib.auth.models import User
from .models import *

# Register your models here.
admin.site.register(Topic)
admin.site.register(Material)
admin.site.register(UserMaterial)
admin.site.register(LabSession)
admin.site.register(GuideStep)