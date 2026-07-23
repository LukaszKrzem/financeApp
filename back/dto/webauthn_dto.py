from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class RegistrationOptionsRequest(BaseModel):
    device_name: Optional[str] = None


class RegistrationVerifyRequest(BaseModel):
    response: Dict[str, Any]
    device_name: Optional[str] = None


class AuthenticationOptionsRequest(BaseModel):
    email: EmailStr


class AuthenticationVerifyRequest(BaseModel):
    email: EmailStr
    response: Dict[str, Any]


class WebAuthnCredentialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_credential: int
    device_name: Optional[str] = None
    created_at: datetime
