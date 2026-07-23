import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key_12345")
DEMO_USER_EMAIL = os.getenv("DEMO_USER_EMAIL", "demo@demo.com")
