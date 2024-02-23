import { State as AccountState } from 'store/account/slice'
import { State as APIState } from 'store/api/slice'
import { State as AnalyticsState } from 'store/cache/analytics/slice'
import { State as ClaimsState } from 'store/cache/claims/slice'
import { State as ContentNodeState } from 'store/cache/contentNode/slice'
import { State as DiscoveryProviderState } from 'store/cache/discoveryProvider/slice'
import { State as MusicState } from 'store/cache/music/slice'
import { State as ProposalsState } from 'store/cache/proposals/slice'
import { State as ProtocolState } from 'store/cache/protocol/slice'
import { State as RewardsState } from 'store/cache/rewards/slice'
import { State as TimelineState } from 'store/cache/timeline/slice'
import { State as UserState } from 'store/cache/user/slice'
import { State as VotesState } from 'store/cache/votes/slice'

export type AppState = {
  account: AccountState
  api: APIState
  cache: {
    discoveryProvider: DiscoveryProviderState
    contentNode: ContentNodeState
    protocol: ProtocolState
    user: UserState
    proposals: ProposalsState
    votes: VotesState
    timeline: TimelineState
    claims: ClaimsState
    analytics: AnalyticsState
    music: MusicState
    rewards: RewardsState
  }
}

export default AppState
