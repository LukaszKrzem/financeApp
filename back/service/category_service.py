from typing import List

import sqlalchemy.orm

import back.structure as structure


def get_all_categories(db: sqlalchemy.orm.Session) -> List[structure.Category]:
    return db.query(structure.Category).all()
