import pydantic
from pydantic import ConfigDict


class AccountOut(pydantic.BaseModel):
    id_account: int
    name: str
    current_balance: float
    Currency_id_currency: int
    currency_code: str
    bank_connection_id: int | None = None
    bank_account_uid: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AccountCreate(pydantic.BaseModel):
    name: str
    current_balance: float
    Currency_id_currency: int


class AccountUpdate(pydantic.BaseModel):
    name: str
