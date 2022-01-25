type ChallengeType = 'boolean' | 'numeric' | 'aggregate' | 'trending'

export type UserChallenge = {
  challenge_id: ChallengeRewardID
  challenge_type: ChallengeType
  current_step_count: number
  is_active: boolean
  is_complete: boolean
  is_disbursed: boolean
  max_steps: number
  specifier: string
  user_id: string
  amount: number
}

export type ChallengeRewardID =
  | 'track-upload'
  | 'referrals'
  | 'referrals-verified'
  | 'referred'
  | 'mobile-install'
  | 'connect-verified'
  | 'listen-streak'
  | 'profile-completion'

export type TrendingRewardID =
  | 'trending-track'
  | 'trending-playlist'
  | 'top-api'
  | 'verified-upload'
  | 'trending-underground'

export enum FailureReason {
  HCAPTCHA = 'HCAPTCHA',
  COGNITO_FLOW = 'COGNITO_FLOW',
  BLOCKED = 'BLOCKED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  ALREADY_DISBURSED = 'ALREADY_DISBURSED'
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
 * Needed for notifications for now as UserChallenges might not be loaded yet
 * @deprecated amounts should be pulled in directly from user challenges instead
 */
export const amounts: Record<ChallengeRewardID, number> = {
  referrals: 1,
  referred: 1,
  'referrals-verified': 1,
  'connect-verified': 5,
  'listen-streak': 1,
  'mobile-install': 1,
  'profile-completion': 1,
  'track-upload': 1
}
