from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, PasswordResetToken


class UserSerializer(serializers.ModelSerializer):
    """Serializer for CustomUser model."""
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                  'profile_pic_url', 'is_email_verified', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_email_verified']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'password', 'password_confirm', 
                  'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            username=validated_data.get('username') or validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user data in response.
    Access token: short-lived (15 min), in memory
    Refresh token: long-lived (7 days), httpOnly cookie
    
    Accepts either 'email' or 'username' as the identifier.
    """
    username = serializers.CharField(required=True)  # Can be email or username
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if needed
        token['email'] = user.email
        return token
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        # If username field looks like an email, try to find user by email
        if username and '@' in username:
            try:
                user = CustomUser.objects.get(email=username)
                attrs['username'] = user.username
            except CustomUser.DoesNotExist:
                from rest_framework_simplejwt.exceptions import AuthenticationFailed
                raise AuthenticationFailed('No user found with this email.')
        
        data = super().validate(attrs)
        # Add user data to response
        data['user'] = UserSerializer(self.user).data
        return data


class TokenRefreshCustomSerializer(serializers.Serializer):
    """Serializer for token refresh endpoint."""
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(write_only=True)
    
    def validate_refresh(self, value):
        from rest_framework_simplejwt.tokens import RefreshToken
        try:
            RefreshToken(value)
        except Exception:
            raise serializers.ValidationError('Invalid refresh token.')
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset."""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('No user with this email found.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for resetting password with token."""
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        
        # Validate token
        try:
            reset_token = PasswordResetToken.objects.get(
                token_hash=attrs['token'],
                is_used=False
            )
            if reset_token.is_expired():
                raise serializers.ValidationError({'token': 'Reset token has expired.'})
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({'token': 'Invalid or expired reset token.'})
        
        attrs['reset_token'] = reset_token
        return attrs
