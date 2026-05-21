import pytest
import sqlalchemy
from sqlalchemy.orm import sessionmaker
from back.structure import User
from back.database import Base
from back.service.user_service import add_user
from back.main import app
from fastapi.testclient import TestClient
from back.database import get_db


DB_URL = "sqlite:///:memory:"

engine = sqlalchemy.create_engine(DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)

    app.dependency_overrides.clear()


# @pytest.fixture
# def client():
#     return TestClient(app)