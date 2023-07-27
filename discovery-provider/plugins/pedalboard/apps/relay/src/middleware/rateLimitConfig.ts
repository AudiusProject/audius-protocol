import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible"
import lcm from "compute-lcm"
import { logger } from "../logger"

// type alias for ease
export type RelayRateLimits = Map<string, RelayRateLimitConfig>

export type RelayRateLimitConfig = {
    // how many times the owner of the entity is limited to
    owner: number,
    // how many times the official app is limited to
    app: number,
    // how many times the whitelisted users are limited to
    whitelist: number,
}

export type RateLimiterKey = {
  operation: Operation,
  limit: ValidLimits,
  ip: string,
}

// so code is easier to follow
export type Operation = string
export type ValidLimits = "owner" | "app" | "whitelist"
// operation -> in mem rate limiter
export type RateLimiters = Map<Operation, RateLimiterMemory>

export class RelayRateLimiter {
  private readonly rateLimits: RelayRateLimits
  private rateLimiters: RateLimiters
  private readonly keySeparator = ":"

  constructor() {
    this.rateLimits = this.readRelayRateLimits()
    this.rateLimiters = this.initRateLimiters(this.rateLimits)
  }

  /** Initializing methods */
  private readRelayRateLimits(): RelayRateLimits {
    return Object.entries(RELAY_RATE_LIMITS).reduce((acc, [key, value]) => {
        acc.set(key, value)
        return acc
    }, new Map())
  }

  private initRateLimiters(rateLimits: RelayRateLimits): RateLimiters {
    const rateLimiters = new Map<string, RateLimiterMemory>()
    for (const [operation, {owner, app, whitelist}] of rateLimits) {
      const leastCommonMultiple = lcm([owner, app, whitelist])
      if (leastCommonMultiple === null) throw new Error(`no LCM for ${owner} ${app} ${whitelist}`)
      const opts = { points: leastCommonMultiple, duration: 60 }
      const rateLimiter = new RateLimiterMemory(opts)
      rateLimiters.set(operation, rateLimiter)
    }
    return rateLimiters
  }

  async consume(key: RateLimiterKey): Promise<RateLimiterRes> {
    const rateLimiter = this.rateLimiters.get(key.operation)
    const rateLimits = this.rateLimits.get(key.operation)
    if (rateLimiter === undefined) {
      throw new Error(`Rate limit not found | ${key.operation} not created`)
    }
    if (rateLimits === undefined) {
      throw new Error(`Rate limit not found | ${key.operation} not configured`)
    }
    const amountOfAllowedRequests = rateLimits[key.limit]
    const constructedKey = this.constructRateLimiterKey(key)
    const pointsToConsume = rateLimiter.points / amountOfAllowedRequests
    logger.info({ constructedKey, pointsToConsume, totalPoints: rateLimiter.points, amountOfAllowedRequests, title: "rate-limit-math" })
    return rateLimiter.consume(constructedKey, pointsToConsume)
  }

  /** Rate Limiter Utilities */
  constructRateLimiterKey(key: RateLimiterKey): string {
    const { operation, limit, ip } = key
    return [operation, limit, ip].join(this.keySeparator)
  }

  deconstructRateLimiterKey(key: string): RateLimiterKey {
    const [operation, limitStr, ip] = key.split(this.keySeparator)
    const limit = limitStr as ValidLimits
    return { operation, limit, ip }
  }
}

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
