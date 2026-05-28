import sqlalchemy
import back.database
from sqlalchemy import Enum
import enum

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

class TransactionType(enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"

class Category(back.database.Base):
    __tablename__ = "category"
    id_category = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    type = sqlalchemy.Column(Enum(TransactionType), nullable=False)

class Transaction(back.database.Base):
    __tablename__ = "transaction"
    id_transaction = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    amount = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    date = sqlalchemy.Column(sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.sql.func.now())
    description = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)
    type = sqlalchemy.Column(Enum(TransactionType), nullable=False)

    Account_id_account = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey("account.id_account", ondelete="CASCADE"), nullable=False)
    Category_id_category = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey("category.id_category", ondelete="SET NULL"), nullable=True)