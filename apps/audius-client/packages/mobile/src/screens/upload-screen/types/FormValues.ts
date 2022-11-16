import type { ExtendedTrackMetadata } from '@audius/common'

export type FormValues = ExtendedTrackMetadata & {
  licenseType: {
    allowAttribution: boolean
    commercialUse: boolean
    derivativeWorks: boolean
  }
}
