// type alias for ease
export type RelayRateLimits = Map<string, RelayRateLimitConfig>

export type RelayRateLimitConfig = {
    // how many times the owner of the entity is limited to
    owner: number,
    // how many times the official app is limited to
    app: number,
    // how many times the whitelisted users are limited to
    whiteList: number,
}

export const getRelayRateLimits = (): RelayRateLimits => 
    Object.entries(RELAY_RATE_LIMITS).reduce((acc, [key, value]) => {
        acc.set(key, value)
        return acc
    }, new Map())

const RELAY_RATE_LIMITS = {
    "CreateUser": {
      "owner": 10,
      "app": 5,
      "whitelist": 1000
    },
    "UpdateUser": {
      "owner": 100,
      "app": 5,
      "whitelist": 1000
    },
    "VerifyUser": {
      "owner": 100,
      "app": 5,
      "whitelist": 1000
    },
    "UpdateUserReplicaSet": {
      "owner": 100,
      "app": 5,
      "whitelist": 1000
    },
    "CreateTrack": {
      "owner": 100,
      "app": 20,
      "whitelist": 1000
    },
    "UpdateTrack": {
      "owner": 100,
      "app": 5,
      "whitelist": 1000
    },
    "DeleteTrack": {
      "owner": 100,
      "app": 20,
      "whitelist": 1000
    },
    "CreatePlaylist": {
      "owner": 100,
      "app": 5,
      "whitelist": 1000
    },
    "UpdatePlaylist": {
      "owner": 100,
      "app": 5,
      "whitelist": 1000
    },
    "DeletePlaylist": {
      "owner": 100,
      "app": 5,
      "whitelist": 1000
    },
    "FollowUser": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "UnfollowUser": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "SubscribeUser": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "UnsubscribeUser": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "SaveTrack": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "UnsaveTrack": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "RepostTrack": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "UnrepostTrack": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "SavePlaylist": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "UnsavePlaylist": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "RepostPlaylist": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "UnrepostPlaylist": {
      "owner": 2000,
      "app": 10,
      "whitelist": 1000
    },
    "CreateNotification": {
      "owner": 0,
      "app": 0,
      "whitelist": 1000
    },
    "ViewNotification": {
      "owner": 100,
      "app": 0,
      "whitelist": 1000
    },
    "ViewPlaylistNotification": {
      "owner": 100,
      "app": 100,
      "whitelist": 1000
    },
    "CreateDeveloperApp": {
      "owner": 3,
      "app": 0,
      "whitelist": 1000
    },
    "DeleteDeveloperApp": {
      "owner": 3,
      "app": 0,
      "whitelist": 1000
    },
    "CreateGrant": {
      "owner": 5,
      "app": 0,
      "whitelist": 1000
    },
    "DeleteGrant": {
      "owner": 5,
      "app": 0,
      "whitelist": 1000
    }
  }
