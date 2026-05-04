import sqlalchemy.orm
import structure
import dto.user_dto
from service import auth_service

# Used in registration and login
def get_user_by_email(db: sqlalchemy.orm.Session, email: str):
    return db.query(structure.User).filter(structure.User.email == email).first()

# Used in registration to create a new user
def create_user(db: sqlalchemy.orm.Session, user_data: dto.user_dto.UserCreate):
    hashed_pwd = auth_service.hash_password(user_data.password)
    new_user = structure.User(
        email=user_data.email,
        password=hashed_pwd,
        name=user_data.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user # For use in router, it will be converted to UserOut DTO
