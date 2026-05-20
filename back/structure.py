import sqlalchemy
import back.database

class Currency(back.database.Base):
    __tablename__ = "Currency"
    id_currency = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    code = sqlalchemy.Column(sqlalchemy.CHAR(3), nullable=False)
    name = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    exchange_rate = sqlalchemy.Column(sqlalchemy.Numeric(10, 4), nullable=False)

class User(back.database.Base):
    __tablename__ = "User"
    id_user = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    email = sqlalchemy.Column(sqlalchemy.String(255), nullable=False, unique=True)
    password = sqlalchemy.Column(sqlalchemy.String(255), nullable=False)
    name = sqlalchemy.Column(sqlalchemy.String(255), nullable=False)

class Account(back.database.Base):
    __tablename__ = "account"
    id_account = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(255), nullable=False)
    current_balance = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    Currency_id_currency = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey("Currency.id_currency"), nullable=False)
    User_id_user = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey("User.id_user", ondelete="CASCADE"), nullable=False)