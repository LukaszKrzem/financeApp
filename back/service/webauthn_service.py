import json
import logging
import os
from typing import Any, Dict, List

import sqlalchemy.orm
from fastapi import HTTPException, Request, status
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
)

import back.dto.user_dto as user_dto
import back.dto.webauthn_dto as webauthn_dto
import back.service.auth_service as auth_service
import back.service.user_service as user_service
from back.structure import User, WebAuthnCredential

logger = logging.getLogger(__name__)

RP_NAME = os.getenv("WEBAUTHN_RP_NAME", "Finance App")
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://finance-app-lukaszkrzem.vercel.app",
]


def get_rp_id(http_request: Request) -> str:
    env_rp_id = os.getenv("WEBAUTHN_RP_ID")
    if env_rp_id:
        return env_rp_id

    forwarded_host = http_request.headers.get("x-forwarded-host")
    if forwarded_host:
        host = forwarded_host.split(",")[0].split(":")[0].strip()
        if host:
            return host

    return http_request.url.hostname or "localhost"


def get_origins(http_request: Request) -> List[str]:
    env_origins = os.getenv("WEBAUTHN_ORIGINS")
    origins = set(env_origins.split(",")) if env_origins else set(DEFAULT_ORIGINS)

    origin_header = http_request.headers.get("origin")
    if origin_header:
        origins.add(origin_header)

    scheme = http_request.headers.get("x-forwarded-proto", http_request.url.scheme)
    host = http_request.headers.get(
        "x-forwarded-host", http_request.headers.get("host")
    )
    if host:
        origins.add(f"{scheme}://{host}")

    return list(origins)


def get_registration_options(
    db: sqlalchemy.orm.Session, user: User, http_request: Request
) -> Dict[str, Any]:
    rp_id = get_rp_id(http_request)

    existing_credentials = (
        db.query(WebAuthnCredential)
        .filter(WebAuthnCredential.user_id == user.id_user)
        .all()
    )

    exclude_credentials = []
    for cred in existing_credentials:
        exclude_credentials.append(
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(cred.credential_id))
        )

    options = generate_registration_options(
        rp_id=rp_id,
        rp_name=RP_NAME,
        user_id=str(user.id_user).encode("utf-8"),
        user_name=user.email,
        user_display_name=user.name or user.email,
        exclude_credentials=exclude_credentials,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED
        ),
    )

    # Save challenge in database
    user.current_challenge = bytes_to_base64url(options.challenge)
    db.commit()

    return json.loads(options_to_json(options))


def verify_registration(
    db: sqlalchemy.orm.Session,
    user: User,
    request: webauthn_dto.RegistrationVerifyRequest,
    http_request: Request,
) -> WebAuthnCredential:
    if not user.current_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active registration challenge",
        )

    rp_id = get_rp_id(http_request)
    origins = get_origins(http_request)

    try:
        expected_challenge = base64url_to_bytes(user.current_challenge)
        verification = verify_registration_response(
            credential=request.response,
            expected_challenge=expected_challenge,
            expected_rp_id=rp_id,
            expected_origin=origins,
            require_user_verification=False,
        )
    except Exception as e:
        logger.error("WebAuthn registration verification error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Biometric verification failed: {str(e)}",
        )
    finally:
        user.current_challenge = None
        db.commit()

    cred_id_str = bytes_to_base64url(verification.credential_id)
    public_key_str = bytes_to_base64url(verification.credential_public_key)

    new_credential = WebAuthnCredential(
        user_id=user.id_user,
        credential_id=cred_id_str,
        public_key=public_key_str,
        sign_count=verification.sign_count,
        device_name=request.device_name or "Biometric Device",
    )

    db.add(new_credential)
    db.commit()
    db.refresh(new_credential)
    return new_credential


def get_authentication_options(
    db: sqlalchemy.orm.Session, email: str, http_request: Request
) -> Dict[str, Any]:
    user = user_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email address does not exist",
        )

    credentials = (
        db.query(WebAuthnCredential)
        .filter(WebAuthnCredential.user_id == user.id_user)
        .all()
    )

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No registered biometric devices for this account",
        )

    rp_id = get_rp_id(http_request)

    allow_credentials = [
        PublicKeyCredentialDescriptor(id=base64url_to_bytes(cred.credential_id))
        for cred in credentials
    ]

    options = generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.PREFERRED,
    )

    user.current_challenge = bytes_to_base64url(options.challenge)
    db.commit()

    return json.loads(options_to_json(options))


def verify_authentication(
    db: sqlalchemy.orm.Session,
    request: webauthn_dto.AuthenticationVerifyRequest,
    http_request: Request,
) -> user_dto.TokenResponse:
    user = user_service.get_user_by_email(db, request.email)
    if not user or not user.current_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active biometric login challenge",
        )

    raw_cred_id = request.response.get("id")
    if not raw_cred_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing credential ID in response",
        )

    credential = (
        db.query(WebAuthnCredential)
        .filter(
            WebAuthnCredential.user_id == user.id_user,
            WebAuthnCredential.credential_id == raw_cred_id,
        )
        .first()
    )

    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registered device not found",
        )

    rp_id = get_rp_id(http_request)
    origins = get_origins(http_request)

    try:
        expected_challenge = base64url_to_bytes(user.current_challenge)
        public_key_bytes = base64url_to_bytes(credential.public_key)

        verification = verify_authentication_response(
            credential=request.response,
            expected_challenge=expected_challenge,
            expected_rp_id=rp_id,
            expected_origin=origins,
            credential_public_key=public_key_bytes,
            credential_current_sign_count=credential.sign_count,
            require_user_verification=False,
        )
    except Exception as e:
        logger.error("WebAuthn login verification error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Biometric login failed: {str(e)}",
        )
    finally:
        user.current_challenge = None
        db.commit()

    # Update sign count
    credential.sign_count = verification.new_sign_count
    db.commit()

    token = auth_service.create_access_token({"sub": user.email})
    return {"token": token, "token_type": "bearer", "user": user}


def list_user_credentials(
    db: sqlalchemy.orm.Session, user: User
) -> List[WebAuthnCredential]:
    return (
        db.query(WebAuthnCredential)
        .filter(WebAuthnCredential.user_id == user.id_user)
        .all()
    )


def delete_user_credential(
    db: sqlalchemy.orm.Session, user: User, credential_id: int
) -> bool:
    cred = (
        db.query(WebAuthnCredential)
        .filter(
            WebAuthnCredential.id_credential == credential_id,
            WebAuthnCredential.user_id == user.id_user,
        )
        .first()
    )
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Biometric device not found",
        )

    db.delete(cred)
    db.commit()
    return True
