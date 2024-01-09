import { remoteConfigSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { useIsMobile } from 'utils/clientUtil'

import ExplorePageProvider from './ExplorePageProvider'
import DesktopExplorePage from './components/desktop/ExplorePage'
import MobileExplorePage from './components/mobile/ExplorePage'
const { isRemoteConfigLoaded } = remoteConfigSelectors

const ExplorePage = () => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileExplorePage : DesktopExplorePage

  // Do not render content until remote config is loaded so
  // that tiling layout does not change.
  // TODO: Remove this when Remixables feature flag is removed
  const remoteConfigLoaded = useSelector(isRemoteConfigLoaded)
  if (!remoteConfigLoaded) return null

  return <ExplorePageProvider>{content}</ExplorePageProvider>
}

export default ExplorePage
