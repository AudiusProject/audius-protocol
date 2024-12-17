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
    trending_track = "trending_track"
    trending_underground = "trending_underground"
    trending_playlist = "trending_playlist"
    send_tip = "send_tip"  # Fired for sender
    first_playlist = "first_playlist"
    audio_matching_buyer = "audio_matching_buyer"
    audio_matching_seller = "audio_matching_seller"
    one_shot = "one_shot"
