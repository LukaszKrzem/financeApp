import enum
from datetime import date, datetime, timezone

import sqlalchemy
from sqlalchemy import Enum
from sqlalchemy.orm import relationship

import back.database


class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


class ScheduleFrequency(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


class Currency(back.database.Base):
    __tablename__ = "currency"
    id_currency = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    code = sqlalchemy.Column(sqlalchemy.CHAR(3), nullable=False)
    name = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    exchange_rate = sqlalchemy.Column(sqlalchemy.Numeric(10, 4), nullable=False)

    accounts = relationship("Account", back_populates="currency")
    transactions = relationship("Transaction", back_populates="currency")
    scheduled_transactions = relationship(
        "ScheduledTransaction", back_populates="currency"
    )
    budgets = relationship("Budget", back_populates="currency")
    savings_goals = relationship("SavingsGoal", back_populates="currency")
    rate_history = relationship(
        "CurrencyRateHistory", back_populates="currency", passive_deletes=True
    )


class User(back.database.Base):
    __tablename__ = "user"
    id_user = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    email = sqlalchemy.Column(sqlalchemy.String(255), nullable=False, unique=True)
    password = sqlalchemy.Column(sqlalchemy.String(255), nullable=False)
    name = sqlalchemy.Column(sqlalchemy.String(255), nullable=False)

    current_challenge = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)

    bank_connections = relationship(
        "BankConnection", back_populates="user", passive_deletes=True
    )
    accounts = relationship("Account", back_populates="user", passive_deletes=True)
    budgets = relationship("Budget", back_populates="user", passive_deletes=True)
    savings_goals = relationship(
        "SavingsGoal", back_populates="user", passive_deletes=True
    )
    notifications = relationship(
        "Notification", back_populates="user", passive_deletes=True
    )
    webauthn_credentials = relationship(
        "WebAuthnCredential", back_populates="user", passive_deletes=True
    )


class WebAuthnCredential(back.database.Base):
    __tablename__ = "webauthn_credential"
    id_credential = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id_user", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    credential_id = sqlalchemy.Column(
        sqlalchemy.String(512), nullable=False, unique=True, index=True
    )
    public_key = sqlalchemy.Column(sqlalchemy.Text, nullable=False)
    sign_count = sqlalchemy.Column(sqlalchemy.Integer, nullable=False, default=0)
    device_name = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)
    transports = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)
    created_at = sqlalchemy.Column(
        sqlalchemy.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="webauthn_credentials")


class BankConnection(back.database.Base):
    __tablename__ = "bank_connection"
    id_connection = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id_user", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bank_name = sqlalchemy.Column(sqlalchemy.String(100), nullable=True)
    session_id = sqlalchemy.Column(sqlalchemy.String(255), nullable=False)
    valid_until = sqlalchemy.Column(
        sqlalchemy.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_at = sqlalchemy.Column(
        sqlalchemy.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="bank_connections")
    accounts = relationship(
        "Account", back_populates="bank_connection", passive_deletes=True
    )


class Account(back.database.Base):
    __tablename__ = "account"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("bank_account_uid", name="uq_bank_account_uid"),
    )

    id_account = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(255), nullable=False)
    current_balance = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)

    currency_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("currency.id_currency"),
        nullable=False,
        index=True,
    )
    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id_user", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bank_connection_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("bank_connection.id_connection", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    bank_account_uid = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)

    currency = relationship("Currency", back_populates="accounts")
    user = relationship("User", back_populates="accounts")
    bank_connection = relationship("BankConnection", back_populates="accounts")
    transactions = relationship(
        "Transaction", back_populates="account", passive_deletes=True
    )
    scheduled_transactions = relationship(
        "ScheduledTransaction", back_populates="account", passive_deletes=True
    )

    @property
    def currency_code(self) -> str:
        return self.currency.code if self.currency else ""


class Category(back.database.Base):
    __tablename__ = "categories"
    id_category = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    type = sqlalchemy.Column(Enum(TransactionType), nullable=False)

    transactions = relationship(
        "Transaction", back_populates="category", passive_deletes=True
    )
    scheduled_transactions = relationship(
        "ScheduledTransaction", back_populates="category", passive_deletes=True
    )
    budgets = relationship("Budget", back_populates="category", passive_deletes=True)


class Transaction(back.database.Base):
    __tablename__ = "transaction"
    __table_args__ = (
        sqlalchemy.CheckConstraint(
            "amount >= 0", name="ck_transaction_amount_positive"
        ),
    )

    id_transaction = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    type = sqlalchemy.Column(Enum(TransactionType), nullable=False)
    amount = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    date = sqlalchemy.Column(
        "transaction_date",
        sqlalchemy.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    description = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)
    exchange_rate_snapshot = sqlalchemy.Column(
        sqlalchemy.Numeric(10, 4), nullable=False
    )
    external_id = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("account.id_account", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("categories.id_category", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    currency_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("currency.id_currency"),
        nullable=False,
        index=True,
    )

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    currency = relationship("Currency", back_populates="transactions")

    @property
    def currency_code(self) -> str | None:
        return self.currency.code if self.currency else None

    @property
    def category_name(self) -> str | None:
        return self.category.name if self.category else None


class ScheduledTransaction(back.database.Base):
    __tablename__ = "scheduled_transaction"
    __table_args__ = (
        sqlalchemy.CheckConstraint("amount >= 0", name="ck_scheduled_amount_positive"),
    )

    id_schedule_transaction = sqlalchemy.Column(
        sqlalchemy.Integer, primary_key=True, index=True
    )
    type = sqlalchemy.Column(Enum(TransactionType), nullable=False)
    frequency = sqlalchemy.Column(Enum(ScheduleFrequency), nullable=False)
    next_date = sqlalchemy.Column(sqlalchemy.Date, nullable=False)
    amount = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    description = sqlalchemy.Column(sqlalchemy.String(255), nullable=True)
    exchange_rate_snapshot = sqlalchemy.Column(
        sqlalchemy.Numeric(10, 4), nullable=False
    )

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("account.id_account", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    currency_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("currency.id_currency"),
        nullable=False,
        index=True,
    )
    category_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("categories.id_category", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    account = relationship("Account", back_populates="scheduled_transactions")
    currency = relationship("Currency", back_populates="scheduled_transactions")
    category = relationship("Category", back_populates="scheduled_transactions")

    @property
    def currency_code(self) -> str | None:
        return self.currency.code if self.currency else None

    @property
    def category_name(self) -> str | None:
        return self.category.name if self.category else None

    @property
    def account_name(self) -> str | None:
        return self.account.name if self.account else None


class Budget(back.database.Base):
    __tablename__ = "budget"
    id_budget = sqlalchemy.Column(
        sqlalchemy.Integer, primary_key=True, autoincrement=True
    )
    limit = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    start_date = sqlalchemy.Column(sqlalchemy.Date, nullable=False)
    end = sqlalchemy.Column(sqlalchemy.Date, nullable=False)

    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id_user", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("categories.id_category", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    currency_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("currency.id_currency"),
        nullable=False,
        index=True,
    )

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
    currency = relationship("Currency", back_populates="budgets")


class BudgetAnalytics(back.database.Base):
    __tablename__ = "v_budget_analytics"

    id_budget = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    limit = sqlalchemy.Column(sqlalchemy.Numeric(20, 2))
    start_date = sqlalchemy.Column(sqlalchemy.Date)
    end = sqlalchemy.Column(sqlalchemy.Date)
    user_id = sqlalchemy.Column(sqlalchemy.Integer)
    category_id = sqlalchemy.Column(sqlalchemy.Integer)
    category_name = sqlalchemy.Column(sqlalchemy.String)
    currency_id = sqlalchemy.Column(sqlalchemy.Integer)
    currency_code = sqlalchemy.Column(sqlalchemy.String)
    current_spent = sqlalchemy.Column(sqlalchemy.Numeric(20, 2))
    percent_used = sqlalchemy.Column(sqlalchemy.Float)


class SavingsGoal(back.database.Base):
    __tablename__ = "savinggoal"
    id_saving_goal = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)
    target = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    current_amount = sqlalchemy.Column(sqlalchemy.Numeric(20, 2), nullable=False)
    start_date = sqlalchemy.Column(sqlalchemy.Date, nullable=False, default=date.today)
    time_limit = sqlalchemy.Column(sqlalchemy.Date, nullable=True)

    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id_user", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    currency_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("currency.id_currency"),
        nullable=False,
        index=True,
    )

    user = relationship("User", back_populates="savings_goals")
    currency = relationship("Currency", back_populates="savings_goals")

    @property
    def currency_code(self) -> str:
        return self.currency.code if self.currency else ""

    @property
    def percent_complete(self) -> float:
        if self.target and float(self.target) > 0:
            return round((float(self.current_amount) / float(self.target)) * 100, 2)
        return 0.0


class Notification(back.database.Base):
    __tablename__ = "notification"
    id_notification = sqlalchemy.Column(
        sqlalchemy.Integer, primary_key=True, index=True
    )
    message = sqlalchemy.Column("message", sqlalchemy.String(400), nullable=False)
    date = sqlalchemy.Column(
        "date",
        sqlalchemy.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    is_read = sqlalchemy.Column(sqlalchemy.Boolean, nullable=False, default=False)

    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id_user", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user = relationship("User", back_populates="notifications")


class CurrencyRateHistory(back.database.Base):
    __tablename__ = "currency_rate_history"
    id_rate_history = sqlalchemy.Column(
        sqlalchemy.Integer, primary_key=True, index=True
    )
    currency_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("currency.id_currency", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    exchange_rate = sqlalchemy.Column(sqlalchemy.Numeric(10, 4), nullable=False)
    recorded_at = sqlalchemy.Column(
        sqlalchemy.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    currency = relationship("Currency", back_populates="rate_history")

    @property
    def currency_code(self) -> str:
        return self.currency.code if self.currency else ""
