import sqlalchemy

DB_URL = "postgresql://admin:password123@localhost:5432/finance_app"

engine = sqlalchemy.create_engine(DB_URL)
SessionLocal = sqlalchemy.orm.sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = sqlalchemy.ext.declarative.declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()