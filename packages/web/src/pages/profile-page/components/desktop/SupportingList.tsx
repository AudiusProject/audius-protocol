import { useCallback } from 'react'

import { useSupportedUsers } from '@audius/common/api'
import { User } from '@audius/common/models'
import { profilePageSelectors } from '@audius/common/store'
import { formatCount, MAX_PROFILE_SUPPORTING_TILES } from '@audius/common/utils'
import { IconTipping, IconArrowRight, PlainButton, Flex } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'
import { SupportingTile } from './SupportingTile'
const { getProfileUser } = profilePageSelectors

const messages = {
  supporting: 'Supporting',
  viewAll: 'View All'
}

const formatViewAllMessage = (count: number) => {
  return `${messages.viewAll} ${formatCount(count)}`
}

const SupportingListForProfile = ({ profile }: { profile: User }) => {
  const dispatch = useDispatch()
  const { data: supportedUsers, isSuccess } = useSupportedUsers({
    userId: profile.user_id,
    limit: MAX_PROFILE_SUPPORTING_TILES
  })

  const handleClickSeeMore = useCallback(() => {
    if (profile) {
      dispatch(
        setUsers({
          userListType: UserListType.SUPPORTING,
          entityType: UserListEntityType.USER,
          id: profile.user_id
        })
      )
      dispatch(setVisibility(true))
    }
  }, [profile, dispatch])

  return isSuccess && supportedUsers.length > 0 ? (
    <Flex direction='column' mt='2xl' gap='l'>
      <ProfilePageNavSectionTitle
        title={messages.supporting}
        titleIcon={<IconTipping color='default' size='m' />}
      />
      {supportedUsers.map((supporting) => (
        <SupportingTile
          key={supporting.receiver.user_id}
          supporting={supporting}
        />
      ))}
      {profile.supporting_count > MAX_PROFILE_SUPPORTING_TILES ? (
        <PlainButton
          iconRight={IconArrowRight}
          css={{ alignSelf: 'flex-start' }}
          onClick={handleClickSeeMore}
        >
          {formatViewAllMessage(profile.supporting_count)}
        </PlainButton>
      ) : null}
    </Flex>
  ) : null
}

export const SupportingList = () => {
  const profile = useSelector(getProfileUser)
  return profile ? <SupportingListForProfile profile={profile} /> : null
}
