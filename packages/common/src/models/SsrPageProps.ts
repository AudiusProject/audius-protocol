import { full as FullSdk } from '@audius/sdk'

export type SsrPageProps = {
  track?: FullSdk.TrackFull
  error?: { isErrorPageOpen: boolean }
}
