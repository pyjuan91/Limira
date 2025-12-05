"""add_disclosure_type_and_patent_fields

Revision ID: a69ae931855c
Revises: 804216b412de
Create Date: 2025-12-05 05:52:07.672395

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a69ae931855c'
down_revision = '804216b412de'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the enum type first
    disclosuretype = sa.Enum('NEW_DISCLOSURE', 'PATENT_REVIEW', name='disclosuretype')
    disclosuretype.create(op.get_bind(), checkfirst=True)

    # Add columns with server_default for existing rows
    op.add_column('disclosures', sa.Column(
        'disclosure_type',
        disclosuretype,
        nullable=False,
        server_default='NEW_DISCLOSURE'
    ))
    op.add_column('disclosures', sa.Column('patent_number', sa.String(), nullable=True))
    op.add_column('disclosures', sa.Column('patent_file_id', sa.Integer(), nullable=True))
    op.add_column('disclosures', sa.Column('ai_analysis', sa.JSON(), nullable=True))
    op.create_foreign_key('fk_disclosures_patent_file_id', 'disclosures', 'files', ['patent_file_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_disclosures_patent_file_id', 'disclosures', type_='foreignkey')
    op.drop_column('disclosures', 'ai_analysis')
    op.drop_column('disclosures', 'patent_file_id')
    op.drop_column('disclosures', 'patent_number')
    op.drop_column('disclosures', 'disclosure_type')

    # Drop the enum type
    disclosuretype = sa.Enum('NEW_DISCLOSURE', 'PATENT_REVIEW', name='disclosuretype')
    disclosuretype.drop(op.get_bind(), checkfirst=True)
