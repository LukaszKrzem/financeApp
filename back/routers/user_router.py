from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import sqlalchemy.orm
import database
import dto.user_dto
from service import user_service, auth_service
from dependencies import get_current_user

# To group user endpoints
router = APIRouter(tags=["Users"])

# Endpoint for user registration. Returns data formated as UserOut DTO
@router.post("/register", response_model=dto.user_dto.TokenResponse)
def register(user_data: dto.user_dto.UserCreate, db: sqlalchemy.orm.Session = Depends(database.get_db)):
    existing_user = user_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Podany email jest już używany")
    new_user = user_service.create_user(db, user_data)
    token = auth_service.create_access_token({"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

# Endpoint for user login. Returns message and user info if successful
@router.post("/login", response_model=dto.user_dto.TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: sqlalchemy.orm.Session = Depends(database.get_db)):
    user = user_service.get_user_by_email(db, form_data.username)
    if not user or not auth_service.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Niepoprawny email lub hasło")
    token = auth_service.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

# Endpoint to get current user info based on the provided JWT token. Used for getting user info 
@router.get("/me", response_model=dto.user_dto.UserOut)
def read_users_me(current_user = Depends(get_current_user)):
    return current_user