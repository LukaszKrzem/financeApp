import pytest
from back.service import auth_service

def test_verify_password_correct_password():
    hashed = auth_service.hash_password("correct")
    result = auth_service.verify_password("correct", hashed)

    assert result is True

def test_verify_password_incorrect_password():
    hashed = auth_service.hash_password("correct")
    result = auth_service.verify_password("incorrect", hashed)

    assert result is False

