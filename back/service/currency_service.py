from typing import List

import sqlalchemy.orm

import back.structure as structure


def get_all_currencies(db: sqlalchemy.orm.Session) -> List[structure.Currency]:
    return db.query(structure.Currency).all()


def get_currency_rate_history(
    db: sqlalchemy.orm.Session, currency_code: str = None
) -> list[structure.CurrencyRateHistory]:
    query = db.query(structure.CurrencyRateHistory).options(
        sqlalchemy.orm.joinedload(structure.CurrencyRateHistory.currency)
    )

    if currency_code:
        query = query.join(structure.CurrencyRateHistory.currency).filter(
            structure.Currency.code == currency_code.upper()
        )

    return query.order_by(structure.CurrencyRateHistory.recorded_at.desc()).all()
