import boto3
from botocore.exceptions import ClientError
from django.conf import settings
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)


class S3Service:
    """Service for AWS S3 operations."""
    
    def __init__(self):
        # Initialize S3 client only if credentials are available
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )
            self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            self.enabled = True
        else:
            self.s3_client = None
            self.bucket_name = None
            self.enabled = False
            logger.warning("S3Service initialized without AWS credentials. S3 operations will be disabled.")
    
    def generate_presigned_upload_url(self, file_name, file_type, expiration=300):
        """
        Generate presigned POST URL for browser direct upload to S3.
        
        This allows frontend to upload directly to S3 without passing through Django.
        
        Args:
            file_name: Name of file to upload
            file_type: MIME type (e.g., 'image/jpeg')
            expiration: URL expiration in seconds (default 5 minutes)
        
        Returns:
            Dict with presigned URL and upload form data
        """
        if not self.enabled:
            logger.warning("S3 upload attempted but AWS credentials not configured")
            return None
            
        try:
            # Generate unique key with timestamp to avoid collisions
            timestamp = timezone.now().timestamp()
            s3_key = f'uploads/{int(timestamp)}/{file_name}'
            
            # Generate presigned POST
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    'acl': 'public-read',
                    'Content-Type': file_type,
                },
                Conditions=[
                    {'acl': 'public-read'},
                    {'Content-Type': file_type},
                    ['content-length-range', 0, 10485760],  # 10MB max
                ],
                ExpiresIn=expiration,
            )
            
            logger.info(f'Generated presigned URL for {s3_key}')
            return {
                'upload_url': response['url'],
                's3_key': s3_key,
                'form_data': response['fields'],
            }
        
        except ClientError as e:
            logger.error(f'Error generating presigned URL: {str(e)}')
            return {'error': str(e)}
    
    def delete_file(self, s3_key):
        """
        Delete file from S3.
        
        Args:
            s3_key: S3 object key to delete
        
        Returns:
            Dict with success status
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f'Deleted S3 file: {s3_key}')
            return {'status': 'success'}
        
        except ClientError as e:
            logger.error(f'Error deleting S3 file: {str(e)}')
            return {'error': str(e)}
    
    def get_file_url(self, s3_key):
        """Get public URL for S3 file."""
        return f'https://{self.bucket_name}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}'


# Singleton instance
s3_service = S3Service() if settings.AWS_ACCESS_KEY_ID else None
