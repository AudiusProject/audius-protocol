import { useCallback } from 'react'

import { useProfileUser, useSupportedUsers } from '@audius/common/api'
import { formatCount, MAX_PROFILE_SUPPORTING_TILES } from '@audius/common/utils'
import {
  IconTipping,
  IconArrowRight,
  PlainButton,
  Skeleton,
  Flex,
  Box
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import { ProfilePageNavSectionItem } from './ProfilePageNavSectionItem'
import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'
import { SupportingTile } from './SupportingTile'

const messages = {
  supporting: 'Supporting',
  viewAll: 'View All'
}

const formatViewAllMessage = (count: number) => {
  return `${messages.viewAll} ${formatCount(count)}`
}

export const SupportingList = () => {
  const { user: profile } = useProfileUser()
  const dispatch = useDispatch()
  const { data: supportedUsers = [], isLoading } = useSupportedUsers({
    userId: profile?.user_id,
    pageSize: MAX_PROFILE_SUPPORTING_TILES
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

  const shouldShowSection = profile && profile.supporting_count > 0

  if (!shouldShowSection) return null

  return (
    <ProfilePageNavSectionItem>
      <ProfilePageNavSectionTitle
        title={messages.supporting}
        Icon={IconTipping}
      />
      {isLoading ? (
        <Flex column gap='m'>
          <Skeleton border='strong' h={122} borderRadius='m' />
          {/* Spacer to account for the gap between the last tile and the see more button */}
          <Box h={16} />
        </Flex>
      ) : (
        <>
          {supportedUsers.map((supporting) => (
            <SupportingTile
              key={supporting.receiver.user_id}
              supporting={supporting}
            />
          ))}
          {profile?.supporting_count &&
          profile.supporting_count > MAX_PROFILE_SUPPORTING_TILES ? (
            <PlainButton
              iconRight={IconArrowRight}
              css={{ alignSelf: 'flex-start' }}
              onClick={handleClickSeeMore}
            >
              {formatViewAllMessage(profile.supporting_count)}
            </PlainButton>
          ) : null}
        </>
      )}
    </ProfilePageNavSectionItem>
  )
}
