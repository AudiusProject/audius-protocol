import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

import type { BottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'
import iconExplore from './animations/iconExplore.lottie'
import iconSearchExplore from './animations/iconSearchExplore.lottie'

const colorKeypaths = [
  'icon_Explore Outlines.Group 1.Fill 1',
  'icon_Explore Outlines.Group 2.Fill 1'
]

const searchExploreColorKeypaths = ['Magnifying Glass.Group 1.Fill 1']

type ExploreButtonProps = BottomTabBarButtonProps

export const ExploreButton = (props: ExploreButtonProps) => {
  const searchExploreFeatureFlag = useFeatureFlag(
    FeatureFlags.SEARCH_EXPLORE_MOBILE
  )
  const isSearchExploreMobileEnabled =
    searchExploreFeatureFlag.isEnabled && searchExploreFeatureFlag.isLoaded
  return (
    <BottomTabBarButton
      {...props}
      name='explore'
      source={isSearchExploreMobileEnabled ? iconSearchExplore : iconExplore}
      colorKeypaths={
        isSearchExploreMobileEnabled
          ? searchExploreColorKeypaths
          : colorKeypaths
      }
    />
  )
}
