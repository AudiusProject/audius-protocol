import {
  Variant,
  SmartCollectionVariant,
  SmartCollection
} from '@audius/common/models'

import IconExploreFeelingLucky from 'assets/img/iconExploreFeelingLucky.svg'
import IconExploreMostLoved from 'assets/img/iconExploreMostLoved.svg'
import IconExploreNewReleases from 'assets/img/iconExploreNewReleases.svg'
import IconExploreRemixables from 'assets/img/iconExploreRemixables.svg'
import IconExploreRotation from 'assets/img/iconExploreRotation.svg'
import IconExploreUnderRadar from 'assets/img/iconExploreUnderRadar.svg'

import {
  EXPLORE_HEAVY_ROTATION_PAGE,
  EXPLORE_BEST_NEW_RELEASES_PAGE,
  EXPLORE_UNDER_THE_RADAR_PAGE,
  EXPLORE_MOST_LOVED_PAGE,
  EXPLORE_FEELING_LUCKY_PAGE,
  EXPLORE_REMIXABLES_PAGE,
  AUDIO_NFT_PLAYLIST_PAGE
} from '../../../utils/route'

export const HEAVY_ROTATION: SmartCollection = {
  variant: Variant.SMART,
  playlist_name: SmartCollectionVariant.HEAVY_ROTATION,
  description: 'Your top tracks, in one place',
  gradient: 'linear-gradient(316deg, #C751C0 0%, #4158D0 100%)',
  shadow: 'rgba(196,81,193,0.35)',
  icon: IconExploreRotation as any,
  link: EXPLORE_HEAVY_ROTATION_PAGE
}

export const BEST_NEW_RELEASES: SmartCollection = {
  variant: Variant.SMART,
  playlist_name: SmartCollectionVariant.BEST_NEW_RELEASES,
  description: 'From the artists you follow',
  gradient: 'linear-gradient(135deg, #FF3C6C 0%, #A04B8E 100%)',
  shadow: 'rgba(160,74,141,0.35)',
  icon: IconExploreNewReleases as any,
  link: EXPLORE_BEST_NEW_RELEASES_PAGE
}

export const UNDER_THE_RADAR: SmartCollection = {
  variant: Variant.SMART,
  playlist_name: SmartCollectionVariant.UNDER_THE_RADAR,
  description: 'Tracks you might have missed from the artists you follow',
  gradient: 'linear-gradient(135deg, #FFA63B 0%, #FF2525 100%)',
  shadow: 'rgba(255,47,39,0.35)',
  icon: IconExploreUnderRadar as any,
  link: EXPLORE_UNDER_THE_RADAR_PAGE
}

export const MOST_LOVED: SmartCollection = {
  variant: Variant.SMART,
  playlist_name: SmartCollectionVariant.MOST_LOVED,
  description: 'Tracks favorited by the people you follow',
  gradient: 'linear-gradient(135deg, #896BFF 0%, #0060FF 100%)',
  shadow: 'rgba(3,96,255,0.35)',
  icon: IconExploreMostLoved as any,
  link: EXPLORE_MOST_LOVED_PAGE
}

export const REMIXABLES: SmartCollection = {
  variant: Variant.SMART,
  playlist_name: SmartCollectionVariant.REMIXABLES,
  description:
    'Popular tracks with remixes & stems you can use in your own tracks.',
  gradient: 'linear-gradient(137.65deg, #FF00F5 -5.01%, #00D1FF 110.47%)',
  shadow: 'rgba(87,170,255,0.35)',
  icon: IconExploreRemixables as any,
  link: EXPLORE_REMIXABLES_PAGE
}

export const FEELING_LUCKY: SmartCollection = {
  variant: Variant.SMART,
  playlist_name: SmartCollectionVariant.FEELING_LUCKY,
  description: 'A purely random collection of tracks from Audius',
  gradient: 'linear-gradient(135deg, #19CCA2 0%, #61FA66 100%)',
  shadow: 'rgba(95,249,103,0.35)',
  icon: IconExploreFeelingLucky as any,
  link: EXPLORE_FEELING_LUCKY_PAGE
}

export const AUDIO_NFT_PLAYLIST: SmartCollection = {
  variant: Variant.SMART,
  playlist_name: SmartCollectionVariant.AUDIO_NFT_PLAYLIST,
  makeDescription: (name: string) =>
    `A collection of Audio NFTs owned and created by ${name}`,
  link: AUDIO_NFT_PLAYLIST_PAGE
}

export const SMART_COLLECTION_MAP = {
  [SmartCollectionVariant.HEAVY_ROTATION]: HEAVY_ROTATION,
  [SmartCollectionVariant.BEST_NEW_RELEASES]: BEST_NEW_RELEASES,
  [SmartCollectionVariant.UNDER_THE_RADAR]: UNDER_THE_RADAR,
  [SmartCollectionVariant.MOST_LOVED]: MOST_LOVED,
  [SmartCollectionVariant.FEELING_LUCKY]: FEELING_LUCKY,
  [SmartCollectionVariant.REMIXABLES]: REMIXABLES,
  [SmartCollectionVariant.AUDIO_NFT_PLAYLIST]: AUDIO_NFT_PLAYLIST
}
