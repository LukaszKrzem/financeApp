import pytest
import sqlalchemy

def test_connection(db_session):
    result = db_session.execute(sqlalchemy.text("SELECT 1"))
    assert result.scalar() == 1

