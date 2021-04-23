from datetime import datetime
from dateutil.parser import parse
from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.trending_type_and_version import TrendingType, TrendingVersion

b = 5
qw = 50
hg = 1
ie = 0.25
pn = 0.01
u = 30.0
qq = 0.001
oi = 20
nb = 750

class DefaultUndergroundTrendingTracksStrategy(BaseTrendingStrategy):
    def __init__(self):
        super().__init__(TrendingType.UNDERGROUND_TRACKS, TrendingVersion.DEFAULT)

    def get_track_score(self, time, track):
        # pylint: disable=W,C,R
        mn = track['listens']
        c =track['windowed_repost_count']
        x = track['repost_count']
        v =track['windowed_save_count']
        ut =track['save_count']
        ll=track['created_at']
        bq=track['owner_follower_count']
        ty = track['owner_verified']
        kz = track['karma']
        xy=max
        uk=pow
        if bq<3:
            return{'score':0,**track}
        oj = qq if ty else 1
        zu = 1
        if bq >= nb:
            zu = xy(uk(oi,1-((1/nb)*(bq-nb)+1)),1/oi)
        vb = ((b*mn+qw*c+hg*v+ie*x+pn*ut+zu*bq)*kz*zu*oj)
        te = 7
        fd = datetime.now()
        xn = parse(ll)
        ul = (fd-xn).days
        rq = 1
        if ul > te:
            rq = xy((1.0 / u),(uk(u,(1 - ul/te))))
        return{'score':vb * rq, **track}

    def get_score_params(self):
        return {'S': 1500, 'r': 1500, 'q': 50, 'o': 21, 'f': 7, 'qr': 10, 'xf': False, 'pt': 0}
