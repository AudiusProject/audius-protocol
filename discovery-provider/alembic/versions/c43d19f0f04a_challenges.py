"""challenges

Revision ID: c43d19f0f04a
Revises: 7f4f44a8e880
Create Date: 2021-05-28 21:39:43.367139

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c43d19f0f04a'
down_revision = '7f4f44a8e880'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('challenges',
                    sa.Column('id', sa.String(), nullable=False, primary_key=True),
                    sa.Column('type', sa.Enum('boolean', 'numeric', name='challengetype'), nullable=False),
                    sa.Column('amount', sa.Integer(), nullable=False),
                    sa.Column('active', sa.Boolean(), nullable=False),
                    sa.Column('step_count', sa.Integer()),
                    sa.Column('starting_block', sa.Integer()),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_table('user_challenges',
                    sa.Column('challenge_id', sa.String(), sa.ForeignKey('challenges.id'), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('specifier', sa.String(), nullable=False),
                    sa.Column('is_complete', sa.Boolean(), nullable=False),
                    sa.Column('current_step_count', sa.Integer()),
                    sa.PrimaryKeyConstraint('challenge_id', 'specifier')
                    )
    op.create_table('challenge_disbursements', 
                    sa.Column('challenge_id', sa.String(), sa.ForeignKey('challenges.id'), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('amount', sa.Integer(), nullable=False),
                    sa.Column('block_number', sa.Integer(), nullable=False),
                    sa.Column('specifier', sa.String(), nullable=False),
                    sa.PrimaryKeyConstraint('challenge_id', 'specifier')
                    )
    op.create_table('challenge_profile_completion',
                    sa.Column('user_id', sa.Integer(), nullable=False, primary_key=True),
                    sa.Column('profile_description', sa.Boolean(), nullable=False),
                    sa.Column('profile_name', sa.Boolean(), nullable=False),
                    sa.Column('profile_picture', sa.Boolean(), nullable=False),
                    sa.Column('profile_cover_photo', sa.Boolean(), nullable=False),
                    sa.Column('follows_complete', sa.Boolean(), nullable=False),
                    sa.Column('favorites_complete', sa.Boolean(), nullable=False),
                    sa.Column('reposts_complete', sa.Boolean(), nullable=False)
                    )

def downgrade():
    op.drop_table('user_challenges')
    op.drop_table('challenge_disbursements')
    op.drop_table('challenge_profile_completion')
    op.drop_table('challenges')
