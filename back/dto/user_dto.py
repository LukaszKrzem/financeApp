import pydantic

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
    # Needed to convert sqlalchemy User model to this DTO
    class Config:
        from_attributes = True

# DTO for user login | kinda pointless rn after using OAuth2
class UserLogin(pydantic.BaseModel):
    email: pydantic.EmailStr
    password: str

class TokenResponse(pydantic.BaseModel):
    token: str
    token_type: str
    user: UserOut