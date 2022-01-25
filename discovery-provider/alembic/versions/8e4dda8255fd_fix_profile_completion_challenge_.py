"""fix_profile_completion_challenge_playlist_favorite

Revision ID: 8e4dda8255fd
Revises: a6d2e50a8efa
Create Date: 2022-01-21 20:19:05.992646

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8e4dda8255fd"
down_revision = "a6d2e50a8efa"
branch_labels = None
depends_on = None


def upgrade():
    pass
    connection = op.get_bind()
    connection.execute(
        """
        begin;

        -- This migration serves to repair missing state in
        -- challenge_profile_completion where previously playlist favorites (saves)
        -- did not update the challenge.
        --
        -- First, update challenge_profile_completion rows to account
        -- for playlist saves.
        -- By joining against the saves table for all playlist saves,
        -- we can achieve this and only modify rows where users have done
        -- a playlist save.
        --
        -- Second, use that result to update (recalculate) user_challenges
        -- for users that were updated in the first step.
        --
        with updated as (
            update challenge_profile_completion
            set favorites = true
            from saves
            where
                challenge_profile_completion.user_id = saves.user_id and
                saves.is_current = true and
                (saves.save_type = 'playlist' or saves.save_type = 'album') and
                challenge_profile_completion.favorites = false
            returning challenge_profile_completion.*
        )
        update user_challenges
        set
            is_complete=(
                updated.profile_description and
                updated.profile_name and
                updated.profile_picture and
                updated.profile_cover_photo and
                updated.follows and
                updated.favorites and
                updated.reposts
            ),
            current_step_count=(
                cast(updated.profile_description as int) +
                cast(updated.profile_name as int) +
                cast(updated.profile_picture as int) +
                cast(updated.profile_cover_photo as int) +
                cast(updated.follows as int) +
                cast(updated.favorites as int) +
                cast(updated.reposts as int)
            )
        from updated
        where
            user_challenges.user_id = updated.user_id;
        
        commit;
    """
    )


def downgrade():
    # This migration mutates state and has no relevant down migration
    pass
