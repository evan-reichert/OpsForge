# Import dependencies
import os
from collections.abc import Generator

from sqlalchemy import JSON, DateTime, Integer, String, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

# Initialize database connection and session
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./opsforge.db")

# Create SQLAlchemy engine and sessionmaker
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

# Define SQLAlchemy ORM models
class Base(DeclarativeBase):
    pass

# Define the ReportRecord model
class ReportRecord(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    report_title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    rows_processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    column_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    issue_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    health_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    health_label: Mapped[str] = mapped_column(String(64), nullable=False, default="Unknown")
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)

# Define utility functions for database operations
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)

# Define a dependency to get a database session
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
