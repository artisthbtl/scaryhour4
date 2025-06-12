from django.contrib import admin
from django.urls import path, include
from api.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/register/', CreateUserView.as_view(), name='register'),

    path('api/token/new/', TokenObtainPairView.as_view(), name='get_token'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('api-auth/', include('rest_framework.urls')),

    path('api/topic/new/', CreateTopicView.as_view(), name='create-list-topic'),

    path('api/material/new/', CreateMaterialView.as_view(), name='create-list-material'),
    path('api/materials/<int:pk>/delete/', DeleteMaterialView.as_view(), name='delete-material'),

    path('api/usermaterial/', UserMaterialView.as_view(), name='create-user-material'),

    path('api/topics-with-materials/', TopicMaterialView.as_view(), name='topic-material-list'),

    path('api/user/me/', CurrentUserView.as_view(), name='current-user'),

    path('api/labs/start/', StartLabView.as_view(), name='start-lab'),
]
