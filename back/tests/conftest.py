import pytest
import sqlalchemy
from sqlalchemy.orm import sessionmaker

DB_URL = "postgresql://admin:password123@localhost:5432/finance_app"

engine = sqlalchemy.create_engine(DB_URL)
TestingSessionLocal = sessionmaker(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()

    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()