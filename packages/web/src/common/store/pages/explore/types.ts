import { ID } from 'common/models/Identifiers'
import Status from 'common/models/Status'

export enum Tabs {
  FOR_YOU = 'FOR YOU',
  MOODS = 'MOODS',
  PLAYLISTS = 'PLAYLISTS',
  PROFILES = 'PROFILES'
}

export type ExploreContent = {
  featuredPlaylists: ID[]
  featuredProfiles: ID[]
}

export default interface ExplorePageState {
  status: Status
  playlists: ID[]
  profiles: ID[]
  tab: Tabs
}

export enum ExploreCollectionsVariant {
  LET_THEM_DJ = 'Let Them DJ',
  TOP_ALBUMS = 'Top Albums',
  MOOD = 'Mood',
  DIRECT_LINK = 'Direct Link'
}
