import type { ComponentType } from 'react'

import { SmartCollectionVariant } from '@audius/common'
import type { SvgProps } from 'react-native-svg'
import {
  EXPLORE_HEAVY_ROTATION_PAGE,
  EXPLORE_BEST_NEW_RELEASES_PAGE,
  EXPLORE_UNDER_THE_RADAR_PAGE,
  EXPLORE_MOST_LOVED_PAGE,
  EXPLORE_FEELING_LUCKY_PAGE,
  EXPLORE_REMIXABLES_PAGE
} from 'utils/route'

import {
  IconExploreFeelingLucky,
  IconExploreMostLoved,
  IconExploreNewReleases,
  IconExploreRemixables,
  IconExploreRotation,
  IconRadar
} from '@audius/harmony-native'

export type SmartCollectionScreen =
  | 'UnderTheRadar'
  | 'MostLoved'
  | 'FeelingLucky'
  | 'HeavyRotation'
  | 'BestNewReleases'
  | 'Remixables'

export type SmartCollection = {
  variant: SmartCollectionVariant
  title: string
  description?: string
  gradientColors: string[]
  gradientAngle: number
  shadowColor: string
  shadowOpacity: number
  icon?: ComponentType<SvgProps>
  link: string
  // TODO: Need to implement this when adding data for smart collections
  // playlist_contents?: PlaylistContents
  has_current_user_saved?: boolean
  incentivized?: boolean // Whether we reward winners with Audio
  cardSensitivity?: number
  screen: SmartCollectionScreen
}

export const HEAVY_ROTATION: SmartCollection = {
  title: 'Heavy Rotation',
  variant: SmartCollectionVariant.HEAVY_ROTATION,
  screen: 'HeavyRotation',
  description: 'Your top tracks, in one place',
  gradientColors: ['#C751C0', '#4158D0'],
  gradientAngle: 316,
  shadowColor: 'rgb(196,81,193)',
  shadowOpacity: 0.25,
  icon: IconExploreRotation,
  link: EXPLORE_HEAVY_ROTATION_PAGE
}

export const BEST_NEW_RELEASES: SmartCollection = {
  title: 'Best New Releases',
  variant: SmartCollectionVariant.BEST_NEW_RELEASES,
  screen: 'BestNewReleases',
  description: 'From the artists you follow',
  gradientColors: ['#FF3C6C', '#A04B8E'],
  gradientAngle: 135,
  shadowColor: 'rgb(160,74,141)',
  shadowOpacity: 0.25,
  icon: IconExploreNewReleases,
  link: EXPLORE_BEST_NEW_RELEASES_PAGE
}

export const UNDER_THE_RADAR: SmartCollection = {
  title: 'Under The Radar',
  variant: SmartCollectionVariant.UNDER_THE_RADAR,
  screen: 'UnderTheRadar',
  description: 'Tracks you might have missed from the artists you follow',
  gradientColors: ['#FFA63B', '#FF2525'],
  gradientAngle: 135,
  shadowColor: 'rgb(255,47,39)',
  shadowOpacity: 0.25,
  icon: IconRadar,
  link: EXPLORE_UNDER_THE_RADAR_PAGE
}

export const MOST_LOVED: SmartCollection = {
  title: 'Most Loved',
  variant: SmartCollectionVariant.MOST_LOVED,
  screen: 'MostLoved',
  description: 'Tracks favorited by the people you follow',
  gradientColors: ['#896BFF', '#0060FF'],
  gradientAngle: 135,
  shadowColor: 'rgb(3,96,255)',
  shadowOpacity: 0.25,
  icon: IconExploreMostLoved,
  link: EXPLORE_MOST_LOVED_PAGE
}

export const REMIXABLES: SmartCollection = {
  title: 'Remixables',
  variant: SmartCollectionVariant.REMIXABLES,
  screen: 'Remixables',
  description:
    'Popular tracks with remixes & stems you can use in your own tracks.',
  // TODO: Need custom start and stop values for graident for this and maybe all of them
  // gradient: 'linear-gradient(137.65deg, #FF00F5 -5.01%, #00D1FF 110.47%)',
  gradientColors: ['#FF00F5', '#00D1FF'],
  gradientAngle: 137.65,
  shadowColor: 'rgb(87,170,255)',
  shadowOpacity: 0.25,
  icon: IconExploreRemixables,
  link: EXPLORE_REMIXABLES_PAGE
}

export const FEELING_LUCKY: SmartCollection = {
  title: 'Feeling Lucky?',
  variant: SmartCollectionVariant.FEELING_LUCKY,
  screen: 'FeelingLucky',
  description: 'A purely random collection of tracks from Audius',
  gradientColors: ['#19CCA2', '#61FA66'],
  gradientAngle: 135,
  shadowColor: 'rgb(95,249,103)',
  shadowOpacity: 0.25,
  icon: IconExploreFeelingLucky,
  link: EXPLORE_FEELING_LUCKY_PAGE
}
