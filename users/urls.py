from django.urls import path
from .views import AlumniRecordListCreate, AlumniRecordRetrieveUpdateDestroy

urlpatterns = [
    path('alumni/', AlumniRecordListCreate.as_view(), name='alumni-list-create'),
    # This handles requests to /api/alumni/1/, /api/alumni/2/, etc.
    path('alumni/<int:pk>/', AlumniRecordRetrieveUpdateDestroy.as_view(), name='alumni-detail'),
]