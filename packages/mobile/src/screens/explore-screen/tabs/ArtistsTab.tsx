import { explorePageSelectors, Status, useProxySelector } from '@audius/common'
import { useSelector } from 'react-redux'

import { ProfileList } from 'app/components/profile-list'

import { TabInfo } from '../components/TabInfo'
const { getExploreArtists, getExploreStatus } = explorePageSelectors

const messages = {
  infoHeader: 'Featured Artists'
}

export const ArtistsTab = () => {
  const profiles = useProxySelector(getExploreArtists, [])
  const exploreStatus = useSelector(getExploreStatus)

  return (
    <ProfileList
      isLoading={exploreStatus === Status.LOADING}
      profiles={profiles}
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
    />
  )
}
