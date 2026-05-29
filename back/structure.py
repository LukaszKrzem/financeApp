# IMPORTANT
# I know it's fucked but unloko we need to have a meeting and decide how we want Transaction type to work
# IMPORTANT


from datetime import datetime

import sqlalchemy
import back.database
from sqlalchemy import Enum
import enum

class Currency(back.database.Base):
    __tablename__ = "currency"
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
    Currency_id_currency = sqlalchemy.Column("currency_id_currency", sqlalchemy.Integer, sqlalchemy.ForeignKey("currency.id_currency"), nullable=False)
    User_id_user = sqlalchemy.Column("user_id_user", sqlalchemy.Integer, sqlalchemy.ForeignKey("User.id_user", ondelete="CASCADE"), nullable=False)

class TransactionType(enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"

class Category(back.database.Base):
    __tablename__ = "categories"
    id_category = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    type = sqlalchemy.Column("type", Enum(TransactionType), nullable=False)

class Transaction(back.database.Base):
    __tablename__ = "transaction"
    id_transaction = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    amount = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    date = sqlalchemy.Column("transaction_date", sqlalchemy.DateTime, default=datetime.utcnow, nullable=False)
    description = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)
    # type = sqlalchemy.Column("type", Enum(TransactionType), nullable=False)
    is_income = sqlalchemy.Column("is_income", sqlalchemy.String(1), nullable=False)
    Account_id_account = sqlalchemy.Column("account_id_account", sqlalchemy.Integer, sqlalchemy.ForeignKey("account.id_account", ondelete="CASCADE"), nullable=False)
    Category_id_category = sqlalchemy.Column("categories_id_category", sqlalchemy.Integer, sqlalchemy.ForeignKey("categories.id_category", ondelete="SET NULL"), nullable=True)
    Currency_id_currency = sqlalchemy.Column("currency_id_currency", sqlalchemy.Integer, sqlalchemy.ForeignKey("currency.id_currency"), nullable=False)
    # For now to avoid changing the existing code, we will use this column to determine if it's an income or expense transaction
    # Not sure which option better so we need to debate later
    @property
    def type(self):
        return TransactionType.INCOME if self.is_income in ["T", "Y", "1"] else TransactionType.EXPENSE
    
    @type.setter
    def type(self, value):
        if isinstance(value, TransactionType):
            self.is_income = "T" if value == TransactionType.INCOME else "F"
        else:
            self.is_income = "T" if value == "INCOME" else "F"