from rest_framework import serializers
from .models import AlumniRecord

class AlumniRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlumniRecord
        fields = '__all__'  # This tells Django to convert all columns into JSON