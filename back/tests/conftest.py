from decimal import Decimal

import pytest
import sqlalchemy
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import back.structure as structure
from back.database import Base, get_db
from back.main import app

DB_URL = "sqlite:///:memory:"

engine = sqlalchemy.create_engine(DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(
            sqlalchemy.text("""
            CREATE VIEW IF NOT EXISTS v_budget_analytics AS
            SELECT
                b.id_budget,
                b."limit",
                b.start_date,
                b."end",
                b.user_id,
                b.category_id,
                c.name AS category_name,
                b.currency_id,
                curr.code AS currency_code,
                0.00 AS current_spent,
                0.0 AS percent_used
            FROM budget b
            JOIN categories c ON b.category_id = c.id_category
            JOIN currency curr ON b.currency_id = curr.id_currency;
            """)
        )

    connection = engine.connect()
    transaction = connection.begin()

    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture
def default_currency(db_session):
    existing = (
        db_session.query(structure.Currency)
        .filter(structure.Currency.id_currency == 1)
        .first()
    )
    if not existing:
        pln = structure.Currency(
            id_currency=1, code="PLN", name="Złoty", exchange_rate=Decimal("1.0")
        )
        db_session.add(pln)
        db_session.commit()
        return pln
    return existing


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)


@pytest.fixture
def auth_headers(client):
    user_data = {
        "email": "testuser@example.com",
        "password": "password123",
        "name": "Test User",
    }
    client.post("/register", json=user_data)
    login_res = client.post(
        "/login",
        json={"email": "testuser@example.com", "password": "password123"},
    )
    token = login_res.json()["token"]
    return {"Authorization": f"Bearer {token}"}
