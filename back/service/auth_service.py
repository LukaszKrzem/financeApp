from datetime import datetime, timedelta, timezone

from fastapi.security import OAuth2PasswordBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from passlib.context import CryptContext

from back.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# For now left it here maybe later move to some config file idk
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = (
    60  # change it to less if you want to test token expiration
)

# Sets up password hashing using Argon2 #
# Used Argon2 coz Bcrypt generated some errors with length and i could not bother to fix
# that so unlucky we use Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# To hash a password
def hash_password(password: str):
    return pwd_context.hash(password)


# To verify a password for login
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# Used to generate JWT token after successful login
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, GOOGLE_CLIENT_SECRET, algorithm=ALGORITHM)


# Used to verify JWT token and get user info from it
def verify_token(token: str):
    try:
        payload = jwt.decode(token, GOOGLE_CLIENT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_google_token(token: str):
    certs_urls = [
        "https://finance-app-lukaszkrzem.vercel.app/api/google-certs",
        "https://www.googleapis.com/oauth2/v1/certs",
    ]
    for certs_url in certs_urls:
        try:
            payload = id_token.verify_oauth2_token(
                token, google_requests.Request(), GOOGLE_CLIENT_ID, certs_url=certs_url
            )
            return {
                "email": payload["email"],
                "name": payload["name"],
                "password": None,
            }
        except ValueError:
            return None
        except Exception:
            continue
    return None
