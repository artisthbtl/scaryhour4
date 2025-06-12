from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Topic, Material, UserMaterial, LabSession

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'date_joined']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
class TopicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(validators=[])

    def validate_name(self, value):
        if Topic.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("This material already exists (case-insensitive).")
        return value

    class Meta:
        model = Topic
        fields = ['id', 'name']

class MaterialSerializer(serializers.ModelSerializer):
    name = serializers.CharField(validators=[])

    def validate_name(self, value):
        if Material.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("This material already exists (case-insensitive).")
        return value

    topic = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Topic.objects.all()
    )

    class Meta:
        model = Material
        fields = ['id', 'name', 'description', 'link', 'topic', 'created_at']
    
class UserMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserMaterial
        fields = ['id', 'material', 'done', 'completed_at']
        read_only_fields = ['completed_at']

    def create(self, validated_data):
        user = self.context['request'].user
        material = validated_data['material']

        instance, created = UserMaterial.objects.get_or_create(user=user, material=material)
        return instance
    
class TopicMaterialSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'name', 'materials']

class LabSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabSession
        fields = ['id', 'user', 'material', 'created_at'] # We only really need to send the 'id' back
        read_only_fields = ['user', 'created_at']