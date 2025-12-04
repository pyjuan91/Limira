#!/usr/bin/env python3
"""
Smart migration script for Render deployment
Handles database migration without shell access
"""
import sys
from sqlalchemy import create_engine, inspect, text
from alembic.config import Config
from alembic import command
from app.core.config import settings

def check_table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    if not check_table_exists(engine, table_name):
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def get_current_alembic_version(engine):
    """Get current alembic version from database"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.fetchone()
            return row[0] if row else None
    except Exception:
        # Table doesn't exist
        return None

def smart_migrate():
    """Intelligently migrate database based on current state"""
    print("🔍 Smart Migration: Checking database state...")

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    # Check current alembic version
    current_version = get_current_alembic_version(engine)
    print(f"📊 Current alembic version: {current_version or 'None'}")

    # Check if main tables exist
    users_exists = check_table_exists(engine, 'users')
    patent_drafts_exists = check_table_exists(engine, 'patent_drafts')
    messages_exists = check_table_exists(engine, 'messages')

    print(f"📋 Table status:")
    print(f"   - users: {'✅' if users_exists else '❌'}")
    print(f"   - patent_drafts: {'✅' if patent_drafts_exists else '❌'}")
    print(f"   - messages: {'✅' if messages_exists else '❌'}")

    # Check if full_text column exists
    full_text_exists = check_column_exists(engine, 'patent_drafts', 'full_text')
    selected_text_exists = check_column_exists(engine, 'comments', 'selected_text')

    print(f"📋 Column status:")
    print(f"   - patent_drafts.full_text: {'✅' if full_text_exists else '❌'}")
    print(f"   - comments.selected_text: {'✅' if selected_text_exists else '❌'}")

    # Setup alembic config
    alembic_cfg = Config("alembic.ini")

    # Determine what to do
    if current_version is None:
        if users_exists and patent_drafts_exists:
            # Database has tables but no alembic version
            print("⚠️  Database has tables but no alembic version record")

            if messages_exists and full_text_exists and selected_text_exists:
                # All migrations are applied
                print("✅ All tables and columns exist - stamping to head")
                command.stamp(alembic_cfg, "head")
            elif messages_exists and full_text_exists:
                # Up to full_text migration
                print("📍 Stamping to b3886618479c (after full_text)")
                command.stamp(alembic_cfg, "b3886618479c")
                print("⬆️  Running remaining migrations...")
                command.upgrade(alembic_cfg, "head")
            elif messages_exists:
                # Up to messages migration
                print("📍 Stamping to 3678a1f70779 (after messages)")
                command.stamp(alembic_cfg, "3678a1f70779")
                print("⬆️  Running remaining migrations...")
                command.upgrade(alembic_cfg, "head")
            else:
                # Only initial tables exist
                print("📍 Stamping to 4a1f8d35ed63 (initial migration)")
                command.stamp(alembic_cfg, "4a1f8d35ed63")
                print("⬆️  Running remaining migrations...")
                command.upgrade(alembic_cfg, "head")
        else:
            # Fresh database
            print("🆕 Fresh database - running all migrations")
            command.upgrade(alembic_cfg, "head")
    else:
        # Alembic version exists, just upgrade
        print(f"⬆️  Upgrading from {current_version} to head")
        command.upgrade(alembic_cfg, "head")

    print("✅ Migration completed successfully!")
    engine.dispose()

if __name__ == "__main__":
    try:
        smart_migrate()
    except Exception as e:
        print(f"❌ Migration failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
