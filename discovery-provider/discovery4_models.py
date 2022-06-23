# coding: utf-8
from sqlalchemy import ARRAY, BigInteger, Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Index, Integer, Numeric, String, Table, Text, text
from sqlalchemy.dialects.postgresql import JSONB, OID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
metadata = Base.metadata


class AggregateDailyAppNameMetric(Base):
    __tablename__ = 'aggregate_daily_app_name_metrics'

    id = Column(Integer, primary_key=True, server_default=text("nextval('aggregate_daily_app_name_metrics_id_seq'::regclass)"))
    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class AggregateDailyTotalUsersMetric(Base):
    __tablename__ = 'aggregate_daily_total_users_metrics'

    id = Column(Integer, primary_key=True, server_default=text("nextval('aggregate_daily_total_users_metrics_id_seq'::regclass)"))
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class AggregateDailyUniqueUsersMetric(Base):
    __tablename__ = 'aggregate_daily_unique_users_metrics'

    id = Column(Integer, primary_key=True, server_default=text("nextval('aggregate_daily_unique_users_metrics_id_seq'::regclass)"))
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    summed_count = Column(Integer)


t_aggregate_interval_plays = Table(
    'aggregate_interval_plays', metadata,
    Column('track_id', Integer, index=True),
    Column('genre', String),
    Column('created_at', DateTime),
    Column('week_listen_counts', BigInteger, index=True),
    Column('month_listen_counts', BigInteger, index=True)
)


class AggregateMonthlyAppNameMetric(Base):
    __tablename__ = 'aggregate_monthly_app_name_metrics'

    id = Column(Integer, primary_key=True, server_default=text("nextval('aggregate_monthly_app_name_metrics_id_seq'::regclass)"))
    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class AggregateMonthlyTotalUsersMetric(Base):
    __tablename__ = 'aggregate_monthly_total_users_metrics'

    id = Column(Integer, primary_key=True, server_default=text("nextval('aggregate_monthly_total_users_metrics_id_seq'::regclass)"))
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class AggregateMonthlyUniqueUsersMetric(Base):
    __tablename__ = 'aggregate_monthly_unique_users_metrics'

    id = Column(Integer, primary_key=True, server_default=text("nextval('aggregate_monthly_unique_users_metrics_id_seq'::regclass)"))
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    summed_count = Column(Integer)


t_aggregate_playlist = Table(
    'aggregate_playlist', metadata,
    Column('playlist_id', Integer, unique=True),
    Column('is_album', Boolean),
    Column('repost_count', BigInteger),
    Column('save_count', BigInteger)
)


t_aggregate_plays = Table(
    'aggregate_plays', metadata,
    Column('play_item_id', Integer, unique=True),
    Column('count', BigInteger)
)


class AggregateTrack(Base):
    __tablename__ = 'aggregate_track'

    track_id = Column(Integer, primary_key=True)
    repost_count = Column(Integer, nullable=False)
    save_count = Column(Integer, nullable=False)


class AggregateUser(Base):
    __tablename__ = 'aggregate_user'

    user_id = Column(Integer, primary_key=True)
    track_count = Column(BigInteger)
    playlist_count = Column(BigInteger)
    album_count = Column(BigInteger)
    follower_count = Column(BigInteger)
    following_count = Column(BigInteger)
    repost_count = Column(BigInteger)
    track_save_count = Column(BigInteger)
    supporter_count = Column(Integer, nullable=False, server_default=text("0"))
    supporting_count = Column(Integer, nullable=False, server_default=text("0"))


class AggregateUserTip(Base):
    __tablename__ = 'aggregate_user_tips'

    sender_user_id = Column(Integer, primary_key=True, nullable=False)
    receiver_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)


t_album_lexeme_dict = Table(
    'album_lexeme_dict', metadata,
    Column('row_number', BigInteger, unique=True),
    Column('playlist_id', Integer),
    Column('playlist_name', Text),
    Column('owner_id', Integer),
    Column('handle', Text, index=True),
    Column('user_name', Text, index=True),
    Column('repost_count', BigInteger),
    Column('word', Text, index=True)
)


class AppNameMetric(Base):
    __tablename__ = 'app_name_metrics'

    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    id = Column(BigInteger, primary_key=True)
    ip = Column(String)


t_app_name_metrics_all_time = Table(
    'app_name_metrics_all_time', metadata,
    Column('name', String),
    Column('count', BigInteger)
)


t_app_name_metrics_trailing_month = Table(
    'app_name_metrics_trailing_month', metadata,
    Column('name', String),
    Column('count', BigInteger)
)


t_app_name_metrics_trailing_week = Table(
    'app_name_metrics_trailing_week', metadata,
    Column('name', String),
    Column('count', BigInteger)
)


class AssociatedWallet(Base):
    __tablename__ = 'associated_wallets'
    __table_args__ = (
        Index('ix_associated_wallets_wallet', 'wallet', 'is_current'),
        Index('ix_associated_wallets_user_id', 'user_id', 'is_current')
    )

    id = Column(Integer, primary_key=True, server_default=text("nextval('associated_wallets_id_seq'::regclass)"))
    user_id = Column(Integer, nullable=False)
    wallet = Column(String, nullable=False)
    blockhash = Column(String, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    chain = Column(Enum('eth', 'sol', name='wallet_chain'), nullable=False)


class AudiusDataTx(Base):
    __tablename__ = 'audius_data_txs'

    signature = Column(String, primary_key=True)
    slot = Column(Integer, nullable=False)


class Block(Base):
    __tablename__ = 'blocks'

    blockhash = Column(String, primary_key=True)
    parenthash = Column(String)
    is_current = Column(Boolean, unique=True)
    number = Column(Integer, unique=True)


class BlocksCopy(Base):
    __tablename__ = 'blocks_copy'

    blockhash = Column(String, primary_key=True)
    parenthash = Column(String)
    is_current = Column(Boolean, unique=True)
    number = Column(Integer, unique=True)


class ChallengeDisbursement(Base):
    __tablename__ = 'challenge_disbursements'

    challenge_id = Column(String, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    specifier = Column(String, primary_key=True, nullable=False)
    signature = Column(String, nullable=False)
    slot = Column(Integer, nullable=False, index=True)
    amount = Column(String, nullable=False)


class ChallengeListenStreak(Base):
    __tablename__ = 'challenge_listen_streak'

    user_id = Column(Integer, primary_key=True, server_default=text("nextval('challenge_listen_streak_user_id_seq'::regclass)"))
    last_listen_date = Column(DateTime)
    listen_streak = Column(Integer, nullable=False)


class ChallengeProfileCompletion(Base):
    __tablename__ = 'challenge_profile_completion'

    user_id = Column(Integer, primary_key=True, server_default=text("nextval('challenge_profile_completion_user_id_seq'::regclass)"))
    profile_description = Column(Boolean, nullable=False)
    profile_name = Column(Boolean, nullable=False)
    profile_picture = Column(Boolean, nullable=False)
    profile_cover_photo = Column(Boolean, nullable=False)
    follows = Column(Boolean, nullable=False)
    favorites = Column(Boolean, nullable=False)
    reposts = Column(Boolean, nullable=False)


class Challenge(Base):
    __tablename__ = 'challenges'

    id = Column(String, primary_key=True)
    type = Column(Enum('boolean', 'numeric', 'aggregate', 'trending', name='challengetype'), nullable=False)
    amount = Column(String, nullable=False)
    active = Column(Boolean, nullable=False)
    step_count = Column(Integer)
    starting_block = Column(Integer)


class EthBlock(Base):
    __tablename__ = 'eth_blocks'

    last_scanned_block = Column(Integer, primary_key=True, server_default=text("nextval('eth_blocks_last_scanned_block_seq'::regclass)"))
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class HourlyPlayCount(Base):
    __tablename__ = 'hourly_play_counts'

    hourly_timestamp = Column(DateTime, primary_key=True)
    play_count = Column(Integer, nullable=False)


class IndexingCheckpoint(Base):
    __tablename__ = 'indexing_checkpoints'

    tablename = Column(String, primary_key=True)
    last_checkpoint = Column(Integer, nullable=False)


class IpldBlacklistBlock(Base):
    __tablename__ = 'ipld_blacklist_blocks'

    blockhash = Column(String, primary_key=True)
    number = Column(Integer, unique=True)
    parenthash = Column(String)
    is_current = Column(Boolean, index=True)


class Milestone(Base):
    __tablename__ = 'milestones'
    __table_args__ = (
        Index('milestones_name_idx', 'name', 'id'),
    )

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, primary_key=True, nullable=False)
    threshold = Column(Integer, primary_key=True, nullable=False)
    blocknumber = Column(Integer)
    slot = Column(Integer)
    timestamp = Column(DateTime, nullable=False)


t_pg_stat_statements = Table(
    'pg_stat_statements', metadata,
    Column('userid', OID),
    Column('dbid', OID),
    Column('queryid', BigInteger),
    Column('query', Text),
    Column('calls', BigInteger),
    Column('total_time', Float(53)),
    Column('min_time', Float(53)),
    Column('max_time', Float(53)),
    Column('mean_time', Float(53)),
    Column('stddev_time', Float(53)),
    Column('rows', BigInteger),
    Column('shared_blks_hit', BigInteger),
    Column('shared_blks_read', BigInteger),
    Column('shared_blks_dirtied', BigInteger),
    Column('shared_blks_written', BigInteger),
    Column('local_blks_hit', BigInteger),
    Column('local_blks_read', BigInteger),
    Column('local_blks_dirtied', BigInteger),
    Column('local_blks_written', BigInteger),
    Column('temp_blks_read', BigInteger),
    Column('temp_blks_written', BigInteger),
    Column('blk_read_time', Float(53)),
    Column('blk_write_time', Float(53))
)


t_playlist_lexeme_dict = Table(
    'playlist_lexeme_dict', metadata,
    Column('row_number', BigInteger, unique=True),
    Column('playlist_id', Integer),
    Column('playlist_name', Text),
    Column('owner_id', Integer),
    Column('handle', Text, index=True),
    Column('user_name', Text, index=True),
    Column('repost_count', BigInteger),
    Column('word', Text, index=True)
)


class Play(Base):
    __tablename__ = 'plays'
    __table_args__ = (
        Index('ix_updated_at', 'updated_at', 'id'),
        Index('ix_plays_user_play_item_date', 'play_item_id', 'user_id', 'created_at'),
        Index('ix_plays_user_play_item', 'play_item_id', 'user_id')
    )

    id = Column(Integer, primary_key=True, server_default=text("nextval('plays_id_seq'::regclass)"))
    user_id = Column(Integer)
    source = Column(String)
    play_item_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, index=True)
    updated_at = Column(DateTime, nullable=False, index=True)
    slot = Column(Integer, index=True)
    signature = Column(String, index=True)
    city = Column(String)
    region = Column(String)
    country = Column(String)


t_plays_archive = Table(
    'plays_archive', metadata,
    Column('id', Integer, nullable=False),
    Column('user_id', Integer),
    Column('source', String),
    Column('play_item_id', Integer, nullable=False),
    Column('created_at', DateTime, nullable=False),
    Column('updated_at', DateTime, nullable=False),
    Column('slot', Integer),
    Column('signature', String),
    Column('archived_at', DateTime)
)


class Reaction(Base):
    __tablename__ = 'reactions'
    __table_args__ = (
        Index('ix_reactions_reacted_to_reaction_type', 'reacted_to', 'reaction_type'),
    )

    id = Column(Integer, primary_key=True, server_default=text("nextval('reactions_id_seq'::regclass)"))
    slot = Column(Integer, nullable=False, index=True)
    reaction_value = Column(Integer, nullable=False)
    sender_wallet = Column(String, nullable=False)
    reaction_type = Column(String, nullable=False)
    reacted_to = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    tx_signature = Column(String)


class RelatedArtist(Base):
    __tablename__ = 'related_artists'

    user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    related_artist_user_id = Column(Integer, primary_key=True, nullable=False)
    score = Column(Float(53), nullable=False)
    created_at = Column(DateTime, nullable=False)


t_remixes = Table(
    'remixes', metadata,
    Column('parent_track_id', Integer, nullable=False),
    Column('child_track_id', Integer, nullable=False)
)


class RewardManagerTx(Base):
    __tablename__ = 'reward_manager_txs'

    signature = Column(String, primary_key=True)
    slot = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)


class RouteMetric(Base):
    __tablename__ = 'route_metrics'

    route_path = Column(String, nullable=False)
    version = Column(String, nullable=False)
    query_string = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    id = Column(BigInteger, primary_key=True)
    ip = Column(String)


t_route_metrics_all_time = Table(
    'route_metrics_all_time', metadata,
    Column('unique_count', BigInteger),
    Column('count', BigInteger)
)


t_route_metrics_day_bucket = Table(
    'route_metrics_day_bucket', metadata,
    Column('unique_count', BigInteger),
    Column('count', BigInteger),
    Column('time', DateTime)
)


t_route_metrics_month_bucket = Table(
    'route_metrics_month_bucket', metadata,
    Column('unique_count', BigInteger),
    Column('count', BigInteger),
    Column('time', DateTime)
)


t_route_metrics_trailing_month = Table(
    'route_metrics_trailing_month', metadata,
    Column('unique_count', BigInteger),
    Column('count', BigInteger)
)


t_route_metrics_trailing_week = Table(
    'route_metrics_trailing_week', metadata,
    Column('unique_count', BigInteger),
    Column('count', BigInteger)
)


class SkippedTransaction(Base):
    __tablename__ = 'skipped_transactions'

    id = Column(Integer, primary_key=True, server_default=text("nextval('skipped_transactions_id_seq'::regclass)"))
    blocknumber = Column(Integer, nullable=False)
    blockhash = Column(String, nullable=False)
    txhash = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    level = Column(Enum('node', 'network', name='skippedtransactionlevel'), nullable=False)


class SplTokenTx(Base):
    __tablename__ = 'spl_token_tx'

    last_scanned_slot = Column(Integer, primary_key=True)
    signature = Column(String, nullable=False)
    created_at = Column(DateTime(True), nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(True), nullable=False, server_default=text("now()"))


t_stems = Table(
    'stems', metadata,
    Column('parent_track_id', Integer, nullable=False),
    Column('child_track_id', Integer, nullable=False)
)


class SupporterRankUp(Base):
    __tablename__ = 'supporter_rank_ups'

    slot = Column(Integer, primary_key=True, nullable=False, index=True)
    sender_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    receiver_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    rank = Column(Integer, nullable=False)


t_tag_track_user = Table(
    'tag_track_user', metadata,
    Column('tag', Text, index=True),
    Column('track_id', Integer),
    Column('owner_id', Integer),
    Index('tag_track_user_idx', 'tag', 'track_id', 'owner_id', unique=True)
)


t_track_lexeme_dict = Table(
    'track_lexeme_dict', metadata,
    Column('row_number', BigInteger, unique=True),
    Column('track_id', Integer),
    Column('owner_id', Integer),
    Column('track_title', Text),
    Column('handle', Text, index=True),
    Column('user_name', Text, index=True),
    Column('repost_count', Integer),
    Column('word', Text, index=True)
)


class TrackRoute(Base):
    __tablename__ = 'track_routes'
    __table_args__ = (
        Index('track_routes_track_id_idx', 'track_id', 'is_current'),
    )

    slug = Column(String, primary_key=True, nullable=False)
    title_slug = Column(String, nullable=False)
    collision_id = Column(Integer, nullable=False)
    owner_id = Column(Integer, primary_key=True, nullable=False)
    track_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    blockhash = Column(String, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    txhash = Column(String, nullable=False)


class TrackTrendingScore(Base):
    __tablename__ = 'track_trending_scores'

    track_id = Column(Integer, primary_key=True, nullable=False, index=True)
    type = Column(String, primary_key=True, nullable=False, index=True)
    genre = Column(String, index=True)
    version = Column(String, primary_key=True, nullable=False)
    time_range = Column(String, primary_key=True, nullable=False)
    score = Column(Float(53), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)


t_trending_params = Table(
    'trending_params', metadata,
    Column('track_id', Integer, index=True),
    Column('genre', String),
    Column('owner_id', Integer),
    Column('play_count', BigInteger),
    Column('owner_follower_count', BigInteger),
    Column('repost_count', Integer),
    Column('save_count', Integer),
    Column('repost_week_count', BigInteger),
    Column('repost_month_count', BigInteger),
    Column('repost_year_count', BigInteger),
    Column('save_week_count', BigInteger),
    Column('save_month_count', BigInteger),
    Column('save_year_count', BigInteger),
    Column('karma', Numeric)
)


class TrendingResult(Base):
    __tablename__ = 'trending_results'

    user_id = Column(Integer, nullable=False)
    id = Column(String)
    rank = Column(Integer, primary_key=True, nullable=False)
    type = Column(String, primary_key=True, nullable=False)
    version = Column(String, primary_key=True, nullable=False)
    week = Column(Date, primary_key=True, nullable=False)


class UserBalanceChange(Base):
    __tablename__ = 'user_balance_changes'

    user_id = Column(Integer, primary_key=True, server_default=text("nextval('user_balance_changes_user_id_seq'::regclass)"))
    blocknumber = Column(Integer, nullable=False)
    current_balance = Column(String, nullable=False)
    previous_balance = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class UserBalance(Base):
    __tablename__ = 'user_balances'

    user_id = Column(Integer, primary_key=True, server_default=text("nextval('user_balances_user_id_seq'::regclass)"))
    balance = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    associated_wallets_balance = Column(String, nullable=False, server_default=text("'0'::character varying"))
    waudio = Column(String, server_default=text("'0'::character varying"))
    associated_sol_wallets_balance = Column(String, nullable=False, server_default=text("'0'::character varying"))


class UserBankAccount(Base):
    __tablename__ = 'user_bank_accounts'

    signature = Column(String, primary_key=True)
    ethereum_address = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)
    bank_account = Column(String, nullable=False)


class UserBankTx(Base):
    __tablename__ = 'user_bank_txs'

    signature = Column(String, primary_key=True)
    slot = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)


class UserEvent(Base):
    __tablename__ = 'user_events'
    __table_args__ = (
        Index('user_events_user_id_idx', 'user_id', 'is_current'),
    )

    id = Column(Integer, primary_key=True, server_default=text("nextval('user_events_id_seq'::regclass)"))
    blockhash = Column(String)
    blocknumber = Column(Integer)
    is_current = Column(Boolean, nullable=False)
    user_id = Column(Integer, nullable=False)
    referrer = Column(Integer)
    is_mobile_user = Column(Boolean, nullable=False)
    slot = Column(Integer)


t_user_lexeme_dict = Table(
    'user_lexeme_dict', metadata,
    Column('row_number', BigInteger, unique=True),
    Column('user_id', Integer),
    Column('user_name', Text),
    Column('handle', Text, index=True),
    Column('follower_count', BigInteger),
    Column('word', Text, index=True)
)


class UserListeningHistory(Base):
    __tablename__ = 'user_listening_history'

    user_id = Column(Integer, primary_key=True, server_default=text("nextval('user_listening_history_user_id_seq'::regclass)"))
    listening_history = Column(JSONB(astext_type=Text()), nullable=False)


class UserTip(Base):
    __tablename__ = 'user_tips'

    slot = Column(Integer, primary_key=True, nullable=False, index=True)
    signature = Column(String, primary_key=True, nullable=False)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))


class Follow(Base):
    __tablename__ = 'follows'
    __table_args__ = (
        Index('follows_inbound_idx', 'followee_user_id', 'follower_user_id', 'is_current', 'is_delete'),
    )

    blockhash = Column(ForeignKey('blocks.blockhash'))
    blocknumber = Column(ForeignKey('blocks.number'), index=True)
    follower_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    followee_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False)
    txhash = Column(String, primary_key=True, nullable=False, server_default=text("''::character varying"))
    slot = Column(Integer)

    block = relationship('Block', primaryjoin='Follow.blockhash == Block.blockhash')
    block1 = relationship('Block', primaryjoin='Follow.blocknumber == Block.number')


class IpldBlacklist(Base):
    __tablename__ = 'ipld_blacklists'

    blockhash = Column(ForeignKey('ipld_blacklist_blocks.blockhash'), primary_key=True, nullable=False)
    blocknumber = Column(ForeignKey('ipld_blacklist_blocks.number'), nullable=False)
    ipld = Column(String, primary_key=True, nullable=False)
    is_blacklisted = Column(Boolean, primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)

    ipld_blacklist_block = relationship('IpldBlacklistBlock', primaryjoin='IpldBlacklist.blockhash == IpldBlacklistBlock.blockhash')
    ipld_blacklist_block1 = relationship('IpldBlacklistBlock', primaryjoin='IpldBlacklist.blocknumber == IpldBlacklistBlock.number')


class Playlist(Base):
    __tablename__ = 'playlists'

    blockhash = Column(ForeignKey('blocks.blockhash'))
    blocknumber = Column(ForeignKey('blocks.number'), index=True)
    playlist_id = Column(Integer, primary_key=True, nullable=False)
    playlist_owner_id = Column(Integer, nullable=False, index=True)
    is_album = Column(Boolean, nullable=False)
    is_private = Column(Boolean, nullable=False)
    playlist_name = Column(String)
    playlist_contents = Column(JSONB(astext_type=Text()), nullable=False)
    playlist_image_multihash = Column(String)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, nullable=False, index=True)
    upc = Column(String)
    updated_at = Column(DateTime, nullable=False)
    playlist_image_sizes_multihash = Column(String)
    txhash = Column(String, primary_key=True, nullable=False, server_default=text("''::character varying"))
    last_added_to = Column(DateTime)
    slot = Column(Integer)

    block = relationship('Block', primaryjoin='Playlist.blockhash == Block.blockhash')
    block1 = relationship('Block', primaryjoin='Playlist.blocknumber == Block.number')


class Repost(Base):
    __tablename__ = 'reposts'
    __table_args__ = (
        Index('repost_user_id_idx', 'user_id', 'repost_type'),
        Index('repost_item_id_idx', 'repost_item_id', 'repost_type')
    )

    blockhash = Column(ForeignKey('blocks.blockhash'))
    blocknumber = Column(ForeignKey('blocks.number'), index=True)
    user_id = Column(Integer, primary_key=True, nullable=False)
    repost_item_id = Column(Integer, primary_key=True, nullable=False)
    repost_type = Column(Enum('track', 'playlist', 'album', name='reposttype'), primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False, index=True)
    txhash = Column(String, primary_key=True, nullable=False, server_default=text("''::character varying"))
    slot = Column(Integer)

    block = relationship('Block', primaryjoin='Repost.blockhash == Block.blockhash')
    block1 = relationship('Block', primaryjoin='Repost.blocknumber == Block.number')


class Save(Base):
    __tablename__ = 'saves'
    __table_args__ = (
        Index('save_item_id_idx', 'save_item_id', 'save_type'),
        Index('save_user_id_idx', 'user_id', 'save_type')
    )

    blockhash = Column(ForeignKey('blocks.blockhash'))
    blocknumber = Column(ForeignKey('blocks.number'), index=True)
    user_id = Column(Integer, primary_key=True, nullable=False)
    save_item_id = Column(Integer, primary_key=True, nullable=False)
    save_type = Column(Enum('track', 'playlist', 'album', name='savetype'), primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False)
    txhash = Column(String, primary_key=True, nullable=False, server_default=text("''::character varying"))
    slot = Column(Integer)

    block = relationship('Block', primaryjoin='Save.blockhash == Block.blockhash')
    block1 = relationship('Block', primaryjoin='Save.blocknumber == Block.number')


class Track(Base):
    __tablename__ = 'tracks'

    blockhash = Column(ForeignKey('blocks.blockhash'))
    track_id = Column(Integer, primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    owner_id = Column(Integer, nullable=False, index=True)
    title = Column(Text)
    length = Column(Integer)
    cover_art = Column(String)
    tags = Column(String)
    genre = Column(String)
    mood = Column(String)
    credits_splits = Column(String)
    create_date = Column(String)
    release_date = Column(String)
    file_type = Column(String)
    metadata_multihash = Column(String)
    blocknumber = Column(ForeignKey('blocks.number'), index=True)
    track_segments = Column(JSONB(astext_type=Text()), nullable=False)
    created_at = Column(DateTime, nullable=False, index=True)
    description = Column(String)
    isrc = Column(String)
    iswc = Column(String)
    license = Column(String)
    updated_at = Column(DateTime, nullable=False)
    cover_art_sizes = Column(String)
    download = Column(JSONB(astext_type=Text()))
    is_unlisted = Column(Boolean, nullable=False, server_default=text("false"))
    field_visibility = Column(JSONB(astext_type=Text()))
    route_id = Column(String)
    stem_of = Column(JSONB(astext_type=Text()))
    remix_of = Column(JSONB(astext_type=Text()))
    txhash = Column(String, primary_key=True, nullable=False, server_default=text("''::character varying"))
    slot = Column(Integer)
    is_available = Column(Boolean, nullable=False, server_default=text("true"))

    block = relationship('Block', primaryjoin='Track.blockhash == Block.blockhash')
    block1 = relationship('Block', primaryjoin='Track.blocknumber == Block.number')


class UrsmContentNode(Base):
    __tablename__ = 'ursm_content_nodes'

    blockhash = Column(ForeignKey('blocks.blockhash'))
    blocknumber = Column(ForeignKey('blocks.number'))
    created_at = Column(DateTime, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    cnode_sp_id = Column(Integer, primary_key=True, nullable=False)
    delegate_owner_wallet = Column(String, nullable=False)
    owner_wallet = Column(String, nullable=False)
    proposer_sp_ids = Column(ARRAY(Integer()), nullable=False)
    proposer_1_delegate_owner_wallet = Column(String, nullable=False)
    proposer_2_delegate_owner_wallet = Column(String, nullable=False)
    proposer_3_delegate_owner_wallet = Column(String, nullable=False)
    endpoint = Column(String)
    txhash = Column(String, primary_key=True, nullable=False, server_default=text("''::character varying"))
    slot = Column(Integer)

    block = relationship('Block', primaryjoin='UrsmContentNode.blockhash == Block.blockhash')
    block1 = relationship('Block', primaryjoin='UrsmContentNode.blocknumber == Block.number')


class UserChallenge(Base):
    __tablename__ = 'user_challenges'

    challenge_id = Column(ForeignKey('challenges.id'), primary_key=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    specifier = Column(String, primary_key=True, nullable=False)
    is_complete = Column(Boolean, nullable=False)
    current_step_count = Column(Integer)
    completed_blocknumber = Column(Integer)

    challenge = relationship('Challenge')


class User(Base):
    __tablename__ = 'users'

    blockhash = Column(ForeignKey('blocks.blockhash'))
    user_id = Column(Integer, primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    handle = Column(String)
    wallet = Column(String, index=True)
    is_creator = Column(Boolean, nullable=False)
    name = Column(Text)
    profile_picture = Column(String)
    cover_photo = Column(String)
    bio = Column(String)
    location = Column(String)
    metadata_multihash = Column(String)
    creator_node_endpoint = Column(String)
    blocknumber = Column(ForeignKey('blocks.number'), index=True)
    is_verified = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    handle_lc = Column(String, index=True)
    cover_photo_sizes = Column(String)
    profile_picture_sizes = Column(String)
    primary_id = Column(Integer)
    secondary_ids = Column(ARRAY(Integer()))
    replica_set_update_signer = Column(String)
    has_collectibles = Column(Boolean, nullable=False, server_default=text("false"))
    txhash = Column(String, primary_key=True, nullable=False, server_default=text("''::character varying"))
    playlist_library = Column(JSONB(astext_type=Text()))
    is_deactivated = Column(Boolean, nullable=False, index=True, server_default=text("false"))
    slot = Column(Integer)
    user_storage_account = Column(String)
    user_authority_account = Column(String)

    block = relationship('Block', primaryjoin='User.blockhash == Block.blockhash')
    block1 = relationship('Block', primaryjoin='User.blocknumber == Block.number')
