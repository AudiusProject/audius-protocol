import enum

# Needs to be in it's own file, otherwise 
# we get circular imports

class ChallengeEvent(str, enum.Enum):
    profile_update = 'profile_update'
    repost = 'repost'
    follow = 'follow'
    favorite = 'favorite'
