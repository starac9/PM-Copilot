"""
Alembic environment.

WHY this is customized: instead of hard-coding a database URL in alembic.ini, we pull it
from our app's settings (the same .env the app uses) and point Alembic at our SQLAlchemy
`Base.metadata`, so `alembic revision --autogenerate` can detect model changes.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Importing app.models registers every table on Base.metadata (see models/__init__.py).
from app.core.config import settings
from app.core.database import Base
import app.models  # noqa: F401  (side-effect import: loads all model classes)

# Alembic Config object (reads alembic.ini).
config = context.config

# Inject our real DB URL from settings/.env at runtime.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata = all our models, so autogenerate knows the desired schema.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Generate SQL without a live DB connection (rarely used here, kept for completeness)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Apply migrations against a live database connection (the normal path)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
