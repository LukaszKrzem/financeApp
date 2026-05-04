import pydantic

class UserCreate(pydantic.BaseModel):
    email: pydantic.EmailStr
    password: str
    name: str

class UserOut(pydantic.BaseModel):
    id_user: int
    email: str
    name: str

    class Config:
        from_attributes = True

class UserLogin(pydantic.BaseModel):
    email: pydantic.EmailStr
    password: str