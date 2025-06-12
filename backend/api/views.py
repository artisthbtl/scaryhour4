from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .serializers import *
from .models import Topic, Material, UserMaterial, LabSession
from rest_framework.response import Response
import docker
import uuid

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

class StartLabView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        material_id = request.data.get('material_id')
        material = None
        
        if material_id:
            try:
                material = Material.objects.get(id=material_id)
            except Material.DoesNotExist:
                return Response({"error": "Material not found"}, status=status.HTTP_404_NOT_FOUND)
        
        session = LabSession.objects.create(user=request.user, material=material)
        
        try:
            client = docker.from_env()
            username = request.user.username if request.user and request.user.is_authenticated else 'student'
            sanitized_username = "".join(c for c in username if c.isalnum() or c in ('-', '_')).rstrip()

            container_name = f"scaryhour4-kali-{sanitized_username}-{str(session.id)[:8]}"

            try:
                existing_container = client.containers.get(container_name)
                existing_container.remove(force=True)
            except docker.errors.NotFound:
                pass

            container = client.containers.run(
                'scaryhour-kali',
                name=container_name,
                detach=True,
                tty=True,
                stdin_open=True,
                environment={'CONTAINER_USER': username},
            )

            session.kali_container_id = container.id
            session.save()

            serializer = LabSessionSerializer(session)
            return Response({"session_id": session.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            session.delete()
            print(f"Docker failed to start: {e}")
            return Response({"error": "Failed to start the lab environment."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)