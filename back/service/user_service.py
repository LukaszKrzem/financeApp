from passlib.context import CryptContext
import sqlalchemy.orm
import structure
import dto.user_dto

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: sqlalchemy.orm.Session, email: str):
    return db.query(structure.User).filter(structure.User.email == email).first()

def create_user(db: sqlalchemy.orm.Session, user_data: dto.user_dto.UserCreate):
    hashed_pwd = hash_password(user_data.password)
    new_user = structure.User(
        email=user_data.email,
        password=hashed_pwd,
        name=user_data.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
