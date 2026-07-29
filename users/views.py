from rest_framework import generics
from .models import AlumniRecord
from .serializers import AlumniRecordSerializer

# Handles GET (all) and POST (new)
class AlumniRecordListCreate(generics.ListCreateAPIView):
    queryset = AlumniRecord.objects.all()
    serializer_class = AlumniRecordSerializer

# Handles GET (one), PUT (edit), and DELETE (remove)
class AlumniRecordRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = AlumniRecord.objects.all()
    serializer_class = AlumniRecordSerializer