from typing import List

import sqlalchemy.orm

import back.structure as structure


def get_all_currencies(db: sqlalchemy.orm.Session) -> List[structure.Currency]:
    return db.query(structure.Currency).all()


def get_currency_rate_history(
    db: sqlalchemy.orm.Session, currency_code: str = None
) -> list[dict]:
    query = db.query(structure.CurrencyRateHistory, structure.Currency).join(
        structure.Currency,
        structure.CurrencyRateHistory.currency_id == structure.Currency.id_currency,
    )

    if currency_code:
        query = query.filter(structure.Currency.code == currency_code.upper())

    results = query.order_by(structure.CurrencyRateHistory.recorded_at.desc()).all()

    return [
        {
            "id_rate_history": history.id_rate_history,
            "currency_id": history.currency_id,
            "currency_code": currency.code,
            "exchange_rate": history.exchange_rate,
            "recorded_at": history.recorded_at,
        }
        for history, currency in results
    ]
