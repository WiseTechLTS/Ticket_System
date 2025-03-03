from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # or IsAuthenticated as needed
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.generics import ListAPIView

from .models import Ticket
from .serializers import TicketSerializer

from rest_framework import viewsets, pagination

class TicketPagination(pagination.PageNumberPagination):
    page_size = 50  # Adjust based on needs
    page_size_query_param = "page_size"
    max_page_size = 200

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.select_related("department").all()
    serializer_class = TicketSerializer
    pagination_class = TicketPagination

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Filtering by priority
        priority = request.GET.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        # Paginate response
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(self.serializer_class(page, many=True).data)

        return Response(self.serializer_class(queryset, many=True).data)


class TicketListView(ListAPIView):
    queryset = Ticket.objects.prefetch_related('screenshots').all()
    serializer_class = TicketSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_tickets(request):
    """
    Public: Retrieve all tickets.
    """
    tickets = Ticket.objects.all()
    serializer = TicketSerializer(tickets, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([AllowAny])
def ticket_list_create(request):
    """
    GET: Return all tickets.
    POST: Create a new ticket from form data.
    """
    if request.method == 'POST':
        serializer = TicketSerializer(data=request.data)
        if serializer.is_valid():
            # If using authentication, attach the user (e.g., serializer.save(user=request.user))
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # GET: Return all tickets
    tickets = Ticket.objects.all()
    serializer = TicketSerializer(tickets, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([AllowAny])
def ticket_detail(request, pk):
    """
    Retrieve, update, or delete a specific ticket.
    """
    try:
        ticket = Ticket.objects.get(pk=pk)
    except Ticket.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TicketSerializer(ticket)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = TicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        ticket.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
