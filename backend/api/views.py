from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.db.models import Q
from .serializers import *
from .models import *
from rest_framework.response import Response
from collections import OrderedDict
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
    permission_classes = [IsAuthenticated]
    queryset = Topic.objects.all()
    serializer_class = TopicMaterialSerializer

class CurrentUserView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

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
            session_prefix = f"scaryhour4-{sanitized_username}-{str(session.id)[:8]}"
            
            lab_network = None
            
            if material and material.target_image:
                print(f"--- FOUND TARGET IMAGE '{material.target_image}', CREATING FULL LAB ---")
                
                network_name = f"{session_prefix}-net"
                lab_network = client.networks.create(network_name, driver="bridge")
                session.network_id = lab_network.id

                target_container_name = f"{session_prefix}-target"
                target_hostname = 'target'
                target_container = client.containers.run(
                    material.target_image,
                    detach=True,
                    name=target_container_name,
                    hostname=target_hostname,
                    network=lab_network.name,
                )
                session.target_container_id = target_container.id
                print(f"Spawned target '{material.target_image}': {target_container.short_id}")

            else:
                print("--- NO TARGET IMAGE FOUND, CREATING KALI-ONLY SESSION ---")

            kali_container_name = f"{session_prefix}-kali"
            kali_container = client.containers.run(
                'scaryhour-kali',
                name=kali_container_name,
                detach=True,
                tty=True,
                stdin_open=True,
                environment={'CONTAINER_USER': username},
                network=lab_network.name if lab_network else None,
                cap_add=['NET_RAW', 'NET_ADMIN']
            )
            session.kali_container_id = kali_container.id
            print(f"Spawned kali container: {kali_container.short_id}")

            session.save()
            return Response({"session_id": session.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            session.delete()
            print(f"Docker failed to start lab environment: {e}")
            return Response({"error": "Failed to start the lab environment."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LabSessionGuideView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id, *args, **kwargs):
        try:
            session = LabSession.objects.get(id=session_id, user=request.user)
            if session.material:
                steps = session.material.guide_steps.all()
                serializer = GuideStepSerializer(steps, many=True)
                return Response(serializer.data)
            return Response([], status=status.HTTP_200_OK) # No material, so no guide
        except LabSession.DoesNotExist:
            return Response({"error": "Session not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)

class SearchView(APIView):
    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', None)

        if not query:
            return Response([], status=200)

        topic_hits = Topic.objects.filter(name__icontains=query)
        material_hits = Material.objects.filter(name__icontains=query).select_related('topic')

        structured_results = OrderedDict()

        for topic in topic_hits:
            if topic.id not in structured_results:
                structured_results[topic.id] = {
                    "id": topic.id,
                    "name": topic.name,
                    "materials": [
                        {"id": m.id, "name": m.name, "description": m.description, "link": m.link}
                        for m in topic.materials.all()
                    ]
                }

        for material in material_hits:
            topic = material.topic
            if topic.id not in structured_results:
                structured_results[topic.id] = {
                    "id": topic.id,
                    "name": topic.name,
                    "materials": []
                }
            
            existing_material_ids = [m['id'] for m in structured_results[topic.id]['materials']]
            if material.id not in existing_material_ids:
                structured_results[topic.id]['materials'].append({
                    "id": material.id,
                    "name": material.name,
                    "description": material.description,
                    "link": material.link
                })
        final_response_data = list(structured_results.values())
        
        return Response(final_response_data)