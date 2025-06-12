from django.db import models
from django.db.models import UniqueConstraint
from django.contrib.auth.models import User
import uuid

class Topic(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Material(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=250, blank=True, null=True)
    link = models.CharField(max_length=250, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='materials')
    target_image = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name

class UserMaterial(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    done = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            UniqueConstraint(fields=['user', 'material'], name='unique_user_material')
        ]

class LabSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, null=True, blank=True)
    kali_container_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    target_container_id = models.CharField(max_length=255, null=True, blank=True)
    network_id = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Lab Session {self.id} for {self.user.username}"

class GuideStep(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='guide_steps')
    step_number = models.PositiveIntegerField()
    content = models.TextField()

    trigger_command = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['step_number']
        unique_together = ('material', 'step_number')

    def __str__(self):
        return f"{self.material.name} - Step {self.step_number}"