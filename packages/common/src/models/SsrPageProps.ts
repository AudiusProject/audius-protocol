import { full as FullSdk } from '@audius/sdk'

export type SsrPageProps = {
  track?: FullSdk.TrackFull
  user?: FullSdk.UserFull
  error?: { isErrorPageOpen: boolean }
}
