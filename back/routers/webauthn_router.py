from typing import List

import back.dto.user_dto as user_dto
import back.dto.webauthn_dto as webauthn_dto
import back.service.webauthn_service as webauthn_service
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user, prevent_demo_destruction
from back.structure import User
from fastapi import APIRouter, Depends, Request, status

router = APIRouter(prefix="/auth/webauthn", tags=["WebAuthn"])


@router.post("/register/options")
def get_register_options(
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return webauthn_service.get_registration_options(db, current_user, http_request)


@router.post(
    "/register/verify",
    response_model=webauthn_dto.WebAuthnCredentialResponse,
    status_code=status.HTTP_201_CREATED,
)
def verify_registration(
    request: webauthn_dto.RegistrationVerifyRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return webauthn_service.verify_registration(db, current_user, request, http_request)


@router.post("/login/options")
def get_login_options(
    request: webauthn_dto.AuthenticationOptionsRequest,
    http_request: Request,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return webauthn_service.get_authentication_options(db, request.email, http_request)


@router.post("/login/verify", response_model=user_dto.TokenResponse)
def verify_login(
    request: webauthn_dto.AuthenticationVerifyRequest,
    http_request: Request,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return webauthn_service.verify_authentication(db, request, http_request)


@router.get(
    "/credentials", response_model=List[webauthn_dto.WebAuthnCredentialResponse]
)
def list_credentials(
    current_user: User = Depends(get_current_user),
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return webauthn_service.list_user_credentials(db, current_user)


@router.delete("/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(
    credential_id: int,
    current_user: User = Depends(prevent_demo_destruction),
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    webauthn_service.delete_user_credential(db, current_user, credential_id)
    return None
