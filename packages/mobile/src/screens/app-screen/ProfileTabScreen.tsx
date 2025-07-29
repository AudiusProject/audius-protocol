import type { AppTabScreenParamList } from './AppTabScreen'

export type ProfileTabScreenParamList = AppTabScreenParamList & {
  UserProfile: undefined
  EditProfile: undefined
  Collectibles: { collectibleId?: string }
}
