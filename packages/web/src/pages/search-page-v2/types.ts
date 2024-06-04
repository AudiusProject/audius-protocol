import { IconComponent } from '@audius/harmony'

export type Filter =
  | 'genre'
  | 'mood'
  | 'key'
  | 'bpm'
  | 'isPremium'
  | 'hasDownloads'
  | 'isVerified'

export type Category = {
  filters: Filter[]
  icon?: IconComponent
}
