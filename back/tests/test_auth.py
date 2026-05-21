import pytest
from jose import jwt
import time
from freezegun import freeze_time
from datetime import datetime, timedelta, timezone
from back.service import auth_service

def test_verify_password_correct_password():
    hashed = auth_service.hash_password("correct")
    result = auth_service.verify_password("correct", hashed)

    assert result is True

def test_verify_password_incorrect_password():
    hashed = auth_service.hash_password("correct")
    result = auth_service.verify_password("incorrect", hashed)

    assert result is False

def test_token_contains_original_data():
    data = {"sub": "alice@gmail.com"}
    token = auth_service.create_access_token(data)
    decoded = auth_service.verify_token(token)

    assert decoded is not None
    assert decoded["sub"] == "alice@gmail.com"

def test_tampered_token_fails():
    data = {"sub": "alice@gmail.com"}
    token = auth_service.create_access_token(data)
    tampered_token = token[:-1] + "a"
    result = auth_service.verify_token(tampered_token)

    assert result is None

def test_malformed_token_fails():
    bad_token = "not.valid.token"
    result = auth_service.verify_token(bad_token)

    assert result is None

def test_token_expiration():
    base_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    
    expire_minutes = auth_service.ACCESS_TOKEN_EXPIRE_MINUTES
    future_time = base_time + timedelta(minutes=expire_minutes + 1)

    with freeze_time(base_time):
        token = auth_service.create_access_token({"sub": "alice"})

    with freeze_time(future_time):
        result = auth_service.verify_token(token)

    assert result is None 

def test_token_with_wrong_secret_fails():
    data = {"sub": "alice@gmail.com"}
    token = auth_service.create_access_token(data)
    
    try:
        jwt.decode(token, "WRONG_SECRET", algorithms=[auth_service.ALGORITHM])
        assert False
    except Exception:
        assert True