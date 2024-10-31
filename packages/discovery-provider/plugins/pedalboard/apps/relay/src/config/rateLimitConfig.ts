import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import lcm from "compute-lcm";
import { logger } from "../logger";

const DEFAULT_EXPIRY = 60 * 60;

// type alias for ease
export type RelayRateLimits = Map<string, RelayRateLimitConfig>;

export type RelayRateLimitConfig = {
  // how many times the owner of the entity is limited to
  owner: number;
  // how many times the official app is limited to
  app: number;
  // how many times the allowlisted users are limited to
  allowlist: number;
  // how many times an anonymous request is allowed on this node
  // anonymous means no user or developer app ex: UserCreate
  anonymous: number;
};

export type RateLimiterKey = {
  operation: Operation;
  limit: ValidLimits;
  signer: string;
};

// so code is easier to follow
export type Operation = string;
export type ValidLimits = "owner" | "app" | "allowlist" | "anonymous";
// operation -> in mem rate limiter
export type RateLimiters = Map<Operation, RateLimiterMemory>;

export class RelayRateLimiter {
  private readonly rateLimits: RelayRateLimits;
  private rateLimiters: RateLimiters;
  private readonly keySeparator = ":";

  constructor(rateLimitExpiration = DEFAULT_EXPIRY) {
    this.rateLimits = this.readRelayRateLimits();
    this.rateLimiters = this.initRateLimiters(
      this.rateLimits,
      rateLimitExpiration
    );
  }

  /** Initializing methods */
  private readRelayRateLimits(): RelayRateLimits {
    return Object.entries(RELAY_RATE_LIMITS).reduce((acc, [key, value]) => {
      acc.set(key, value);
      return acc;
    }, new Map());
  }

  private initRateLimiters(
    rateLimits: RelayRateLimits,
    duration: number
  ): RateLimiters {
    const rateLimiters = new Map<string, RateLimiterMemory>();
    for (const [operation, { owner, app, allowlist }] of rateLimits) {
      // rate limiter finds least common multiple of all types in config
      // rate limiter then consumes points at different rates per type
      // so each type gets the amount of calls specified in the config
      const leastCommonMultiple = lcm([owner, app, allowlist]);
      if (leastCommonMultiple === null)
        throw new Error(`no LCM for ${owner} ${app} ${allowlist}`);
      // duration is in seconds
      const opts = { points: leastCommonMultiple, duration };
      const rateLimiter = new RateLimiterMemory(opts);
      rateLimiters.set(operation, rateLimiter);
    }
    return rateLimiters;
  }

  async consume(key: RateLimiterKey): Promise<RateLimiterRes> {
    const rateLimiter = this.rateLimiters.get(key.operation);
    const rateLimits = this.rateLimits.get(key.operation);
    if (rateLimiter === undefined) {
      throw new Error(`Rate limit not found | ${key.operation} not created`);
    }
    if (rateLimits === undefined) {
      throw new Error(`Rate limit not found | ${key.operation} not configured`);
    }
    const amountOfAllowedRequests = rateLimits[key.limit];
    const constructedKey = this.constructRateLimiterKey(key);
    if (amountOfAllowedRequests <= 0) {
      logger.warn(`Blocked action attempted | ${key.operation}`);
      // blocks this key for eternity
      const blockedRes = await rateLimiter.block(constructedKey, 0);
      // throw so calling func knows we hit a limit
      throw blockedRes;
    }
    const pointsToConsume = rateLimiter.points / amountOfAllowedRequests;
    return rateLimiter.consume(constructedKey, pointsToConsume);
  }

  /** Rate Limiter Utilities */
  constructRateLimiterKey(key: RateLimiterKey): string {
    const { operation, limit, signer } = key;
    return [operation, limit, signer].join(this.keySeparator);
  }

  deconstructRateLimiterKey(key: string): RateLimiterKey {
    const [operation, limitStr, signer] = key.split(this.keySeparator);
    const limit = limitStr as ValidLimits;
    return { operation, limit, signer };
  }
}

const RELAY_RATE_LIMITS = {
  CreateUser: {
    owner: 10,
    app: 5,
    anonymous: 1000,
    allowlist: 1000,
  },
  UpdateUser: {
    owner: 100,
    app: 5,
    allowlist: 1000,
    anonymous: 0,
  },
  VerifyUser: {
    owner: 100,
    app: 5,
    allowlist: 1000,
    anonymous: 0,
  },
  CreateTrack: {
    owner: 100,
    app: 20,
    allowlist: 1000,
    anonymous: 0,
  },
  UpdateTrack: {
    owner: 100,
    app: 5,
    allowlist: 1000,
    anonymous: 0,
  },
  DeleteTrack: {
    owner: 100,
    app: 20,
    allowlist: 1000,
    anonymous: 0,
  },
  CreatePlaylist: {
    owner: 100,
    app: 5,
    allowlist: 1000,
    anonymous: 0,
  },
  UpdatePlaylist: {
    owner: 100,
    app: 5,
    allowlist: 1000,
    anonymous: 0,
  },
  DeletePlaylist: {
    owner: 100,
    app: 5,
    allowlist: 1000,
    anonymous: 0,
  },
  FollowUser: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  UnfollowUser: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  SubscribeUser: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  UnsubscribeUser: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  SaveTrack: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  UnsaveTrack: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  RepostTrack: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  UnrepostTrack: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  DownloadTrack: {
    owner: 2000,
    app: 2000,
    allowlist: 2000,
    anonymous: 2000,
  },
  SavePlaylist: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  UnsavePlaylist: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  RepostPlaylist: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  UnrepostPlaylist: {
    owner: 2000,
    app: 10,
    allowlist: 1000,
    anonymous: 0,
  },
  CreateNotification: {
    owner: 0,
    app: 0,
    allowlist: 1000,
    anonymous: 0,
  },
  ViewNotification: {
    owner: 1000,
    app: 1000,
    allowlist: 1000,
    anonymous: 1000,
  },
  ViewPlaylistNotification: {
    owner: 1000,
    app: 1000,
    allowlist: 1000,
    anonymous: 1000,
  },
  CreateDeveloperApp: {
    owner: 3,
    app: 0,
    allowlist: 1000,
    anonymous: 0,
  },
  DeleteDeveloperApp: {
    owner: 3,
    app: 0,
    allowlist: 1000,
    anonymous: 0,
  },
  CreateGrant: {
    owner: 5,
    app: 0,
    allowlist: 1000,
    anonymous: 0,
  },
  DeleteGrant: {
    owner: 5,
    app: 0,
    allowlist: 1000,
    anonymous: 0,
  },
};
