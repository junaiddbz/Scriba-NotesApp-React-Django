from django.urls import path, include
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AuthViewSet, CustomTokenObtainPairView, CustomTokenRefreshView

app_name = "auth"

router = SimpleRouter()
router.register(r"", AuthViewSet, basename="auth")

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]
