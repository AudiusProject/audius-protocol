import enum

# Needs to be in it's own file, otherwise
# we get circular imports


class ChallengeEvent(str, enum.Enum):
    profile_update = "profile_update"
    repost = "repost"
    follow = "follow"
    favorite = "favorite"
    track_listen = "track_listen"
    track_upload = "track_upload"
    referral_signup = "referral_signup"  # Fired for the referring user
    referred_signup = "referred_signup"  # Fired for the new user
    connect_verified = "connect_verified"
    mobile_install = "mobile_install"
