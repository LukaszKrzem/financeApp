import back.dto.enable_banking_dto as enable_banking_dto
import back.service.enable_banking_service as enable_banking_service
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/api/banking", tags=["Banking"])


@router.post("/sync", response_model=enable_banking_dto.SyncResponse)
def sync_bank_transactions(
    request: enable_banking_dto.SyncRequest,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return enable_banking_service.sync_bank_transactions(
        db, request, current_user.id_user
    )


@router.get("/aspsps")
def list_aspsps(country: str = "PL", current_user=Depends(get_current_user)):
    """Zwraca listę dostępnych banków (ASPSPs) w danym kraju, do wyboru na froncie."""
    return enable_banking_service.list_aspsps(country)


@router.post("/auth-url", response_model=enable_banking_dto.AuthUrlResponse)
def generate_auth_url(
    request: enable_banking_dto.AuthUrlRequest, current_user=Depends(get_current_user)
):
    return enable_banking_service.generate_auth_url(request)


@router.post("/callback", response_model=enable_banking_dto.AuthCallbackResponse)
def handle_bank_callback(
    request: enable_banking_dto.AuthCallbackRequest,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return enable_banking_service.handle_bank_callback(
        db, request, current_user.id_user
    )
