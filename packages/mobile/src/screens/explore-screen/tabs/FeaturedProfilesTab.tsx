import { useFeaturedProfiles } from '@audius/common/api'

import { UserList } from 'app/components/user-list'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Artists'
}

export const FeaturedProfilesTab = () => {
  const { data: profiles = [], isPending } = useFeaturedProfiles()

  return (
    <UserList
      isLoading={isPending}
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      profiles={profiles}
    />
  )
}
