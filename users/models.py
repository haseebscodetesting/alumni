from django.db import models

class AlumniRecord(models.Model):
    # This translates perfectly from your previous frontend data structure
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    degree = models.CharField(max_length=100)
    year = models.IntegerField()
    company = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    # Automatically tracks when the record was added
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.degree} ({self.year})"