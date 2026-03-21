import logging
import time
from django.db import connection
from django.conf import settings

logger = logging.getLogger(__name__)


class SlowQueryLoggerMiddleware:
    """
    Middleware to log slow database queries.
    Threshold is configurable via SLOW_QUERY_THRESHOLD (default 0.2 seconds).
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.threshold = getattr(settings, 'SLOW_QUERY_THRESHOLD', 0.2)
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log slow queries
        if settings.DEBUG:
            for query in connection.queries:
                duration = float(query['time'])
                if duration > self.threshold:
                    logger.warning(
                        f"SLOW QUERY ({duration:.3f}s): {query['sql'][:200]}..."
                    )
        
        return response
