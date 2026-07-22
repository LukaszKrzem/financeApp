from decimal import Decimal

import back.structure as structure


def test_currency_rate_history(db_session, client):
    currency = structure.Currency(
        code="USD",
        name="US Dollar",
        exchange_rate=Decimal("4.15"),
    )
    db_session.add(currency)
    db_session.commit()
    db_session.refresh(currency)

    history = structure.CurrencyRateHistory(
        currency_id=currency.id_currency,
        exchange_rate=Decimal("4.15"),
    )
    db_session.add(history)
    db_session.commit()

    response = client.get("/currencies/history?code=USD")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["currency_code"] == "USD"
    assert float(data[0]["exchange_rate"]) == 4.15
