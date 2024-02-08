import IconTokenNoTierPng from '@audius/harmony/src/assets/icons/TokenNoTier.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

// The TokenNoTier svg doesnt work on mobile, so we use a png component instead
export const IconTokenNoTier = (props: ImageProps) => (
  <Image source={IconTokenNoTierPng} {...props} />
)
