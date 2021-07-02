from src.utils.db_session import get_db
from src.models import Challenge, ChallengeType, UserChallenge, ChallengeDisbursement, Block
from src.queries.get_challenges import get_challenges

def test_get_challenges(app):
    with app.app_context():
        db = get_db()
        blocks = [
            Block(
                blockhash='0x1',
                number=1,
                parenthash='',
                is_current=True
            )
        ]
        challenges = [
            Challenge(
                id='boolean_challenge_1',
                type=ChallengeType.boolean,
                active=True,
                amount=5
            ),
            Challenge(
                id='boolean_challenge_2',
                type=ChallengeType.boolean,
                active=True,
                amount=5
            ),
            Challenge(
                id='boolean_challenge_3',
                type=ChallengeType.boolean,
                active=True,
                amount=5
            ),
            # No progress on this, but active
            # should be returned
            Challenge(
                id='boolean_challenge_4',
                type=ChallengeType.boolean,
                active=True,
                amount=5
            ),
            # Inactive, with no progress
            Challenge(
                id='boolean_challenge_5',
                type=ChallengeType.boolean,
                active=False,
                amount=5
            ),
            # Inactive, WITH progress
            Challenge(
                id='boolean_challenge_6',
                type=ChallengeType.boolean,
                active=False,
                amount=5
            ),
            Challenge(
                id='trending_challenge_1',
                type=ChallengeType.trending,
                active=True,
                amount=5
            ),
            Challenge(
                id='aggregate_challenge_1',
                type=ChallengeType.aggregate,
                active=True,
                amount=5,
                step_count=3
            ),
            Challenge(
                id='aggregate_challenge_2',
                type=ChallengeType.aggregate,
                active=True,
                amount=5,
                step_count=2
            ),
            Challenge(
                id='aggregate_challenge_3',
                type=ChallengeType.aggregate,
                active=True,
                amount=5,
                step_count=2
            ),
            Challenge(
                id='trending_1',
                type=ChallengeType.trending,
                active=True,
                amount=5
            ),
            Challenge(
                id='trending_2',
                type=ChallengeType.trending,
                active=True,
                amount=5
            ),
            Challenge(
                id='trending_3',
                type=ChallengeType.trending,
                active=True,
                amount=5
            )
        ]
        user_challenges = [
            # Finished the first challenge, disbursed
            UserChallenge(
                challenge_id='boolean_challenge_1',
                user_id=1,
                specifier='1',
                is_complete=True
            ),
            # Did finish the second challenge, did not disburse
            UserChallenge(
                challenge_id='boolean_challenge_2',
                user_id=1,
                specifier='1',
                is_complete=True
            ),
            # Did not finish challenge 3
            UserChallenge(
                challenge_id='boolean_challenge_3',
                user_id=1,
                specifier='1',
                is_complete=False
            ),
            # Inactive challenge
            UserChallenge(
                challenge_id='boolean_challenge_6',
                user_id=1,
                specifier='1',
                is_complete=True
            ),
            UserChallenge(
                challenge_id='aggregate_challenge_1',
                user_id=1,
                specifier='1-2', # compound specifiers, like if user1 invites user2
                is_complete=True
            ),
            # Ensure that a non-complete user-challenge isn't counted towards
            # aggregate challenge score
            UserChallenge(
                challenge_id='aggregate_challenge_1',
                user_id=1,
                specifier='1-3',
                is_complete=False
            ),
            UserChallenge(
                challenge_id='aggregate_challenge_2',
                user_id=1,
                specifier='1-2',
                is_complete=True
            ),
            UserChallenge(
                challenge_id='aggregate_challenge_2',
                user_id=1,
                specifier='1-3',
                is_complete=True
            ),
            # Trending 1 should be finished and included
            UserChallenge(
                challenge_id='trending_1',
                user_id=1,
                specifier='06-01-2020',
                is_complete=True
            ),
            # Trending 2 should not be included
            UserChallenge(
                challenge_id='trending_2',
                user_id=1,
                specifier='06-01-2020',
                is_complete=False
            )
        ]
        disbursements = [
            ChallengeDisbursement(
                challenge_id='boolean_challenge_1',
                user_id=1,
                amount=5,
                block_number=1,
                specifier='1'
            )
        ]
        with db.scoped_session() as session:
            # Wipe any existing challenges in the DB from running migrations, etc
            session.query(Challenge).delete()
            session.commit()
            session.add_all(blocks)
            session.commit()
            session.add_all(challenges)
            session.commit()
            session.add_all(user_challenges)
            session.commit()
            session.add_all(disbursements)

            # Try to get the challenges, not historical
            res = get_challenges(1, False, session)

            # We don't care about the order of the challenges returned
            # so make a map
            res_map = { challenge["challenge_id"]: challenge for challenge in res}
            # Ensure correct num of challenges
            # not returned are:
            # - inactive, with no user_challenge
            # - inactive, with user_challenge
            # - trending, with no user_challenge
            # - trending, with one unfinished user challenge (doesn't even make sense, but it could happen)
            assert len(res) == 8

            # Base case - an active, completed, disbursed chal
            chal_1 = res_map['boolean_challenge_1']
            assert chal_1['is_disbursed']
            assert chal_1['is_active']
            assert chal_1['is_complete']

            # Active, complete, non disbursed
            chal_2 = res_map['boolean_challenge_2']
            assert chal_2['is_disbursed'] == False
            assert chal_2['is_active']
            assert chal_2['is_complete']

            # active, incomplete, nondisbursed
            chal_3 = res_map['boolean_challenge_3']
            assert chal_3['is_disbursed'] == False
            assert chal_3['is_active']
            assert chal_3['is_complete'] == False

            # no user progress, but active, so should be returned
            chal_4 = res_map['boolean_challenge_4']
            assert chal_4['is_disbursed'] == False
            assert chal_4['is_active']
            assert chal_4['is_complete'] == False

            # aggregate challenge with one completion, so not fully complete
            chal_agg_1 = res_map['aggregate_challenge_1']
            assert chal_agg_1['is_disbursed'] == False # This field doesn't matter since we can't roll up disbursions
            assert chal_agg_1['is_active']
            assert chal_agg_1['is_complete'] == False
            assert chal_agg_1['current_step_count'] == 1
            assert chal_agg_1['max_steps'] == 3

            # aggregate challenge with 2 completions, FULLY complete
            chal_agg_2 = res_map['aggregate_challenge_2']
            assert chal_agg_2['is_disbursed'] == False # This field doesn't matter since we can't roll up disbursions
            assert chal_agg_2['is_active']
            assert chal_agg_2['is_complete'] == True
            assert chal_agg_2['current_step_count'] == 2
            assert chal_agg_2['max_steps'] == 2

            # aggregate challenge with no completions
            chal_agg_3 = res_map['aggregate_challenge_3']
            assert chal_agg_3['is_disbursed'] == False # This field doesn't matter since we can't roll up disbursions
            assert chal_agg_3['is_active']
            assert chal_agg_3['is_complete'] == False
            assert chal_agg_3['current_step_count'] == 0
            assert chal_agg_3['max_steps'] == 2

            # complet trending challenge
            chal_trend_1 = res_map['trending_1']
            assert chal_trend_1['is_disbursed'] == False
            assert chal_trend_1['is_active']
            assert chal_trend_1['is_complete']

            # Try to get the challenges, this time historical
            res = get_challenges(1, True, session)

            # The only difference is that we should have shown
            # inactive but complete challenges
            assert len(res) == 9
            res_map = { challenge["challenge_id"]: challenge for challenge in res}
            historical = res_map['boolean_challenge_6']
            assert historical['is_active'] == False
            assert historical['is_complete']
            assert historical['is_disbursed'] == False
