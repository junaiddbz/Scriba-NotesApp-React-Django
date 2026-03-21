from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
import secrets
import hashlib

from .models import CustomUser, PasswordResetToken
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from config.tasks import send_password_reset_email, send_email_verification


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login endpoint.
    POST: Returns access token (memory) + refresh token (httpOnly cookie)
    """
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    """
    Token refresh endpoint.
    Silently renews access token using refresh token from httpOnly cookie.
    """
    pass


class AuthViewSet(viewsets.ViewSet):
    """Authentication endpoints."""
    
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        User registration endpoint.
        POST /api/v1/auth/register/
        Returns: {access_token, refresh_token, user}
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Skip email verification for development
            # In production, uncomment to send verification email via Celery
            # send_email_verification.delay(user.id)
            
            return Response(
                {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data,
                    'message': 'Registration successful.'
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        User login endpoint.
        POST /api/v1/auth/login/
        Returns: {access_token, refresh_token, user}
        """
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """
        User logout endpoint.
        Invalidates refresh token.
        POST /api/v1/auth/logout/
        """
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'No refresh token provided.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Logout successful.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user profile.
        GET /api/v1/auth/me/
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def forgot_password(self, request):
        """
        Request password reset email.
        POST /api/v1/auth/forgot-password/
        """
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = CustomUser.objects.get(email=email)
            
            # Generate secure token
            reset_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
            
            # Create reset token record
            expires_at = timezone.now() + timedelta(minutes=15)
            password_reset_token = PasswordResetToken.objects.create(
                user=user,
                token_hash=token_hash,
                expires_at=expires_at
            )
            
            # Trigger async password reset email task
            send_password_reset_email.delay(user.id, reset_token)
            
            return Response(
                {'message': 'Password reset link sent to your email.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset_password(self, request):
        """
        Reset password with token.
        POST /api/v1/auth/reset-password/
        """
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            password = serializer.validated_data['password']
            
            # Update password
            reset_token.user.set_password(password)
            reset_token.user.save()
            
            # Mark token as used
            reset_token.is_used = True
            reset_token.save()
            
            return Response(
                {'message': 'Password reset successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """
        Change password for authenticated user.
        POST /api/v1/auth/change-password/
        """
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')
        
        if not old_password or not new_password:
            return Response(
                {'detail': 'old_password and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'detail': 'Old password is incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if new_password != new_password_confirm:
            return Response(
                {'detail': 'New passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )
