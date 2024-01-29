import type { ComponentType } from 'react'

import type { ImageSourcePropType } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import {
  IconCart,
  IconCassette,
  IconExploreDJ,
  IconExploreTopAlbums,
  IconExploreTopPlaylists
} from '@audius/harmony-native'
import EmojiDoveOfPeace from 'app/assets/images/emojis/dove-of-peace.png'
import EmojiFire from 'app/assets/images/emojis/fire.png'
import EmojiHeartWithArrow from 'app/assets/images/emojis/heart-with-arrow.png'
import EmojiRaisedHands from 'app/assets/images/emojis/person-raising-both-hands-in-celebration.png'
import EmojiThinkingFace from 'app/assets/images/emojis/thinking-face.png'

import type { ExploreCollectionsVariant } from './types'

export type CollectionScreen =
  | 'PremiumTracks'
  | 'LetThemDJ'
  | 'TopAlbums'
  | 'TrendingPlaylists'
  | 'TrendingUnderground'

export type MoodScreen =
  | 'IntensePlaylists'
  | 'ChillPlaylists'
  | 'ProvokingPlaylists'
  | 'IntimatePlaylists'
  | 'UpbeatPlaylists'

export type ExploreCollection = {
  variant: ExploreCollectionsVariant
  title: string
  description?: string
  gradientColors: string[]
  gradientAngle: number
  shadowColor: string
  shadowOpacity: number
  icon?: ComponentType<SvgProps>
  incentivized?: boolean // Whether we reward winners with $AUDIO
  screen: CollectionScreen | MoodScreen
}

export type ExploreMoodCollection = ExploreCollection & {
  emoji: ImageSourcePropType
  moods: string[]
}

// Just For You Collections
export const PREMIUM_TRACKS: ExploreCollection = {
  variant: 'Direct Link',
  title: 'Premium Tracks',
  screen: 'PremiumTracks',
  description: 'Explore premium music available to purchase.',
  gradientColors: ['#13C65A', '#16A653'],
  gradientAngle: 135,
  shadowColor: 'rgba(196,81,193)',
  shadowOpacity: 0.25,
  icon: IconCart
}

export const LET_THEM_DJ: ExploreCollection = {
  variant: 'Let Them DJ',
  title: 'Let Them DJ',
  screen: 'LetThemDJ',
  description: 'Playlists created by the people you follow',
  gradientColors: ['#08AEEA', '#2AF598'],
  gradientAngle: 315,
  shadowColor: 'rgb(9,175,233)',
  shadowOpacity: 0.25,
  icon: IconExploreDJ
}

export const TOP_ALBUMS: ExploreCollection = {
  variant: 'Top Albums',
  title: 'Top Albums',
  screen: 'TopAlbums',
  description: 'The top albums from all of Audius',
  gradientColors: ['#FF00B6', '#B000FF'],
  gradientAngle: 135,
  shadowColor: 'rgb(177,0,253)',
  shadowOpacity: 0.25,
  icon: IconExploreTopAlbums
}

export const TRENDING_PLAYLISTS: ExploreCollection = {
  variant: 'Direct Link',
  title: 'Trending Playlists',
  screen: 'TrendingPlaylists',
  description: 'The top playlists on Audius right now',
  gradientColors: ['#57ABFF', '#CD98FF'],
  gradientAngle: 315,
  shadowColor: 'rgb(87,170,255)',
  shadowOpacity: 0.25,
  icon: IconExploreTopPlaylists,
  incentivized: true
}

export const TRENDING_UNDERGROUND: ExploreCollection = {
  variant: 'Direct Link',
  title: 'Underground Trending',
  screen: 'TrendingUnderground',
  description:
    'Some of the best up-and-coming music on Audius all in one place',
  gradientColors: ['#BA27FF', '#EF8CD9'],
  gradientAngle: 315,
  shadowColor: 'rgb(242,87,255)',
  shadowOpacity: 0.25,
  icon: IconCassette,
  incentivized: true
}

// Moods Collections
export const CHILL_PLAYLISTS: ExploreMoodCollection = {
  variant: 'Mood',
  title: 'Chill',
  screen: 'ChillPlaylists',
  emoji: EmojiDoveOfPeace,
  gradientColors: ['#2CD1FF', '#FA8BFF'],
  gradientAngle: 135,
  shadowColor: 'rgb(237,144,255)',
  shadowOpacity: 0.25,
  moods: ['peaceful', 'easygoing', 'melancholy']
}

export const PROVOKING_PLAYLISTS: ExploreMoodCollection = {
  variant: 'Mood',
  title: 'Provoking',
  screen: 'ProvokingPlaylists',
  emoji: EmojiThinkingFace,
  gradientColors: ['#3FECF4', '#16A085'],
  gradientAngle: 135,
  shadowColor: 'rgb(115,225,179)',
  shadowOpacity: 0.25,
  moods: ['sophisticated', 'brooding', 'serious', 'stirring']
}

export const INTIMATE_PLAYLISTS: ExploreMoodCollection = {
  variant: 'Mood',
  title: 'Intimate',
  screen: 'IntimatePlaylists',
  emoji: EmojiHeartWithArrow,
  gradientColors: ['#F24FDF', '#C881FF'],
  gradientAngle: 315,
  shadowColor: 'rgb(241,81,225)',
  shadowOpacity: 0.25,
  moods: ['sentimental', 'romantic', 'yearning', 'sensual', 'tender']
}

export const UPBEAT_PLAYLISTS: ExploreMoodCollection = {
  variant: 'Mood',
  title: 'Upbeat',
  screen: 'UpbeatPlaylists',
  emoji: EmojiRaisedHands,
  gradientColors: ['#896BFF', '#0060FF'],
  gradientAngle: 135,
  shadowColor: 'rgb(11,97,255)',
  shadowOpacity: 0.25,
  moods: ['upbeat', 'excited', 'energizing', 'empowering', 'cool']
}

export const INTENSE_PLAYLISTS: ExploreMoodCollection = {
  variant: 'Mood',
  title: 'Intense',
  screen: 'IntensePlaylists',
  emoji: EmojiFire,
  gradientColors: ['#FBAB7E', '#F7CE68'],
  gradientAngle: 315,
  shadowColor: 'rgb(250,173,124)',
  shadowOpacity: 0.25,
  moods: ['rowdy', 'fiery', 'defiant', 'aggressive', 'gritty']
}
