import pydantic
from pydantic import ConfigDict


# DTO for user registration
class UserCreate(pydantic.BaseModel):
    email: pydantic.EmailStr
    password: str
    name: str


# DTO used for responses
class UserOut(pydantic.BaseModel):
    id_user: int
    email: str
    name: str

    model_config = ConfigDict(from_attributes=True)


# DTO for user login
class UserLogin(pydantic.BaseModel):
    email: pydantic.EmailStr
    password: str


# DTO for Google Auth
class GoogleToken(pydantic.BaseModel):
    token: str


class TokenResponse(pydantic.BaseModel):
    token: str
    token_type: str
    user: UserOut
