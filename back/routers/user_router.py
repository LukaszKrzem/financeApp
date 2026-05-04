from fastapi import APIRouter, Depends, HTTPException, status
import sqlalchemy.orm
import database
import dto.user_dto
from service import user_service

# To group user endpoints
router = APIRouter(tags=["Users"])

# Endpoint for user registration. Returns data formated as UserOut DTO
@router.post("/register", response_model=dto.user_dto.UserOut)
def register(user_data: dto.user_dto.UserCreate, db: sqlalchemy.orm.Session = Depends(database.get_db)):
    existing_user = user_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Podany email jest już używany")
    return user_service.create_user(db, user_data)

# Endpoint for user login. Returns message and user info if successful
@router.post("/login")
def login(credentials: dto.user_dto.UserLogin, db: sqlalchemy.orm.Session = Depends(database.get_db)):
    user = user_service.get_user_by_email(db, credentials.email)    
    if not user or not user_service.verify_password(credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Niepoprawny email lub hasło")
    return {"message": "Zalogowano", "user_id": user.id_user, "user_name": user.name}
