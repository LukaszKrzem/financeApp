import pydantic


class AccountOut(pydantic.BaseModel):
    id_account: int
    name: str
    current_balance: float
    Currency_id_currency: int
    currency_code: str
    bank_connection_id: int | None = None
    bank_account_uid: str | None = None

    class Config:
        from_attributes = True


class AccountCreate(pydantic.BaseModel):
    name: str
    current_balance: float
    Currency_id_currency: int


class AccountUpdate(pydantic.BaseModel):
    name: str
