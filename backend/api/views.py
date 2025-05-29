from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .serializers import *
from .models import Material, Topic
from rest_framework.response import Response

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class CreateMaterialView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAdminUser]

class DeleteMaterialView(generics.DestroyAPIView):
    queryset = Material.objects.all()
    permission_classes = [IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        material = self.get_object()
        topic = material.topic
        self.perform_destroy(material)

        if not topic.materials.exists():
            topic.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

class CreateTopicView(generics.ListCreateAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAdminUser]

class UserMaterialView(generics.ListCreateAPIView):
    serializer_class = UserMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserMaterial.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TopicMaterialView(generics.ListAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicMaterialSerializer
    permission_classes = [AllowAny]

class CurrentUserView(generics.ListAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)