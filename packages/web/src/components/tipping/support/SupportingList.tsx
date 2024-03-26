import { useCallback } from 'react'

import { useRankedSupportingForUser } from '@audius/common/hooks'
import { User } from '@audius/common/models'
import { profilePageSelectors } from '@audius/common/store'
import { formatCount, MAX_PROFILE_SUPPORTING_TILES } from '@audius/common/utils'
import { IconTipping, IconArrowRight, PlainButton, Flex } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { ProfilePageNavSectionTitle } from 'components/profile-page-nav-section-title/ProfilePageNavSectionTitle'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

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
  const rankedSupportingList = useRankedSupportingForUser(profile.user_id)

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

  return rankedSupportingList.length > 0 ? (
    <Flex direction='column' mt='2xl' gap='l'>
      <ProfilePageNavSectionTitle
        title={messages.supporting}
        titleIcon={<IconTipping color='default' size='m' />}
      />
      {rankedSupportingList
        .slice(0, MAX_PROFILE_SUPPORTING_TILES)
        .map((supporting) => (
          <SupportingTile key={supporting.rank} supporting={supporting} />
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
