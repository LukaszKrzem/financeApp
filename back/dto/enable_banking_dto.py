from typing import Optional

from pydantic import BaseModel


class SyncRequest(BaseModel):
    account_id: int


class AuthUrlRequest(BaseModel):
    redirect_uri: str
    bank_name: str
    country: str = "PL"


class AuthCallbackRequest(BaseModel):
    code: str
    bank_name: Optional[str] = None


class SyncResponse(BaseModel):
    imported: int
    skipped: int


class AuthUrlResponse(BaseModel):
    auth_url: str


class AuthCallbackResponse(BaseModel):
    message: str
    imported_accounts: int
