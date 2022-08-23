# from src.models.tracks.track import Track
# from src.models.users.user import User
# from src.premium_content.helpers import does_user_have_track_access


# def test_track_access(web3_mock, redis_mock, db_mock):
#     # Set up db state
#     Track.__table__.create(db_mock._engine)
#     User.__table__.create(db_mock._engine)

#     # test non premium track
#     non_premium_track = Track(
#         blockhash="0x01",
#         blocknumber=1,
#         txhash="0x10",
#         track_id=1,
#         owner_id=1,
#         track_segments=[],
#         is_unlisted=False,
#         is_current=True,
#         is_delete=False,
#     )
#     user = User(
#         blockhash="0x02",
#         blocknumber=2,
#         txhash="0x20",
#         user_id=2,
#         is_current=True,
#     )

#     with db_mock.scoped_session() as session:
#         session.add(non_premium_track)
#         session.add(user)

#     result = does_user_have_track_access(
#         db_mock, user.user_id, non_premium_track.track_id
#     )
#     assert result == True

#     # test premium track with user who has no access
#     premium_track = Track(
#         blockhash="0x03",
#         blocknumber=3,
#         txhash="0x30",
#         track_id=2,
#         owner_id=1,
#         track_segments=[],
#         is_premium=True,
#         premium_conditions={"nft-collection": "some-contract-address"},
#         is_unlisted=False,
#         is_current=True,
#         is_delete=False,
#     )

#     with db_mock.scoped_session() as session:
#         session.add(premium_track)

#     result = does_user_have_track_access(db_mock, user.user_id, premium_track.track_id)
#     assert result == False

#     # test premium track with user who has access

#     # mock user with the nft collection

#     result = does_user_have_track_access(db_mock, user.user_id, premium_track.track_id)
#     assert result == False
