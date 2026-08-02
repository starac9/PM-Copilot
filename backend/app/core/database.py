"""
Database connection + session management (SQLAlchemy).

WHY: Every request that touches the DB needs a "session" (a temporary workspace that
batches reads/writes and commits them as a transaction). We create one session per
request and always close it afterwards, so connections don't leak.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# The engine is the low-level pool of connections to Postgres. Created once.
# pool_pre_ping=True quietly checks a connection is still alive before using it —
# important for serverless DBs like Neon that may drop idle connections.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# A factory that produces new Session objects bound to our engine.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all ORM models inherit from. SQLAlchemy uses it to discover tables.
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and guarantees it is closed.

    Usage in a route:  `def route(db: Session = Depends(get_db)): ...`
    The `yield` hands the session to the route; the `finally` runs after the response
    is sent, closing the session even if the route raised an error.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
