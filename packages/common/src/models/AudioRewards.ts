type ChallengeType = 'boolean' | 'numeric' | 'aggregate' | 'trending'

export type UserChallenge = {
  challenge_id: ChallengeRewardID
  challenge_type: ChallengeType
  current_step_count: number
  is_active: boolean
  is_complete: boolean
  is_disbursed: boolean
  max_steps: number
  specifier: Specifier
  user_id: string
  amount: number
}

export type Specifier = string

/** Used to map challenge names which are single letters to their
 * semantic equivalents for easier readability
 */
export enum ChallengeName {
  AudioMatchingBuy = 'b',
  AudioMatchingSell = 's'
}

export type ChallengeRewardID =
  | 'track-upload'
  | 'referrals'
  | 'ref-v'
  | 'referred'
  | 'mobile-install'
  | 'connect-verified'
  | 'listen-streak'
  | 'profile-completion'
  | 'send-first-tip'
  | 'first-playlist'
  | ChallengeName.AudioMatchingSell // $AUDIO matching seller
  | ChallengeName.AudioMatchingBuy // $AUDIO matching buyer
  | 'trending-track'
  | 'trending-playlist'
  | 'top-api'
  | 'verified-upload'
  | 'trending-underground'

export enum FailureReason {
  // The attestation requires the user to fill out a captcha
  HCAPTCHA = 'HCAPTCHA',
  // The attestation is blocked
  BLOCKED = 'BLOCKED',
  // This reward has already been disbursed
  ALREADY_DISBURSED = 'ALREADY_DISBURSED',
  // The funds have already been sent, but we have not
  // indexed the challenge.
  ALREADY_SENT = 'ALREADY_SENT',
  // UserChallenge doesn't exist on DN
  MISSING_CHALLENGES = 'MISSING_CHALLENGES',
  // UserChallenge is not in complete state
  CHALLENGE_INCOMPLETE = 'CHALLENGE_INCOMPLETE',
  // An unknown error has occurred
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  // Unknown AAO error
  AAO_ATTESTATION_UNKNOWN_RESPONSE = 'AAO_ATTESTATION_UNKNOWN_RESPONSE',
  // Need to wait for cooldown period
  WAIT_FOR_COOLDOWN = 'WAIT_FOR_COOLDOWN'
}

export type FlowUIOpenEvent = {
  topic: 'ui'
  action: 'opened'
}
export type FlowUICloseEvent = {
  topic: 'ui'
  action: 'closed'
}

export type FlowErrorEvent = {
  topic: 'error'
  message: string
}

export type FlowSessionID = any
export type FlowSessionCreateEvent = {
  topic: 'session'
  action: 'created'

  data: {
    id: FlowSessionID
  }
}
export type FlowSessionResumeEvent = {
  topic: 'session'
  action: 'resumed'

  data: {
    id: FlowSessionID
  }
}
export type FlowSessionPassEvent = {
  topic: 'session'
  action: 'passed'
}
export type FlowSessionFailEvent = {
  topic: 'session'
  action: 'failed'
}
export type FlowSessionEvent =
  | FlowSessionCreateEvent
  | FlowSessionResumeEvent
  | FlowSessionPassEvent
  | FlowSessionFailEvent

/**
 * Represents the mutually exclusive state of a challenge
 */
export type UserChallengeState =
  | 'inactive'
  | 'incomplete'
  | 'in_progress'
  | 'completed'
  | 'disbursed'

export type SpecifierWithAmount = { specifier: string; amount: number }

/**
 * A User Challenge that has been updated by the client to optimistically include any updates
 */
export type OptimisticUserChallenge = Omit<
  UserChallenge,
  'is_complete' | 'is_active' | 'is_disbursed'
> & {
  __isOptimistic: true
  state: UserChallengeState
  totalAmount: number
  claimableAmount: number
  undisbursedSpecifiers: SpecifierWithAmount[]
}
