# Import dependencies
import os
from collections.abc import Generator

from sqlalchemy import JSON, DateTime, Integer, String, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

# Initialize database connection and session
def _resolve_database_uri() -> str:
    """
    Resolve connection string for SQLAlchemy.
    Priority: DATABASE_URI -> DATABASE_URL -> local sqlite fallback (dev only).
    """
    raw_uri = os.getenv("DATABASE_URI") or os.getenv("DATABASE_URL")

    if raw_uri:
        # Normalize common Postgres URL formats to the psycopg SQLAlchemy dialect.
        if raw_uri.startswith("postgres://"):
            return "postgresql+psycopg://" + raw_uri[len("postgres://"):]
        if raw_uri.startswith("postgresql://"):
            return "postgresql+psycopg://" + raw_uri[len("postgresql://"):]
        return raw_uri

    # In deployment/serverless environments, require explicit DB URI.
    is_production_like = (
        os.getenv("VERCEL") == "1"
        or os.getenv("ENVIRONMENT", "").lower() == "production"
        or os.getenv("PYTHON_ENV", "").lower() == "production"
    )
    if is_production_like:
        raise RuntimeError("DATABASE_URI must be set in production/deployment environments.")

    return "sqlite:///./opsforge.db"


DATABASE_URL = _resolve_database_uri()

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
