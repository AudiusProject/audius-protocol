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
}

export type ChallengeRewardID =
  | 'track-upload'
  | 'invite-friends'
  | 'mobile-app'
  | 'connect-verified'
  | 'listen-streak'
  | 'profile-completion'

export type TrendingRewardID =
  | 'trending-track'
  | 'trending-playlist'
  | 'top-api'
  | 'verified-upload'
  | 'trending-underground'
