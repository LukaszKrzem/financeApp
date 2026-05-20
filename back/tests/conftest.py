import pytest
import sqlalchemy
from sqlalchemy.orm import sessionmaker
from back.structure import User
from back.database import Base
from back.service.user_service import add_user

DB_URL = "sqlite:///:memory:"

engine = sqlalchemy.create_engine(DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    
    connection = engine.connect()
    transaction = connection.begin()

    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()