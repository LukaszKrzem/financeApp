from typing import List

import sqlalchemy.orm

import back.structure as structure


def get_all_currencies(db: sqlalchemy.orm.Session) -> List[structure.Currency]:
    return db.query(structure.Currency).all()
