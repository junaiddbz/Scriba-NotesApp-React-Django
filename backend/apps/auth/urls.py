from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import AuthViewSet, CustomTokenObtainPairView, CustomTokenRefreshView

app_name = "auth"

router = SimpleRouter()
router.register(r"", AuthViewSet, basename="auth")

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]
