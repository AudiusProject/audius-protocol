import { useFeaturedProfiles } from '@audius/common/api'

import { UserList } from 'app/components/user-list'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Artists'
}

export const FeaturedProfilesTab = () => {
  const { data: profiles = [], isLoading } = useFeaturedProfiles()

  return (
    <UserList
      isLoading={isLoading}
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      profiles={profiles}
    />
  )
}
