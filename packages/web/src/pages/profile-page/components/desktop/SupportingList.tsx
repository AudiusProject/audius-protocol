import { useCallback } from 'react'

import { useSupportedUsers } from '@audius/common/api'
import { User } from '@audius/common/models'
import { profilePageSelectors } from '@audius/common/store'
import { formatCount, MAX_PROFILE_SUPPORTING_TILES } from '@audius/common/utils'
import {
  IconTipping,
  IconArrowRight,
  PlainButton,
  Skeleton
} from '@audius/harmony'
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

import { ProfilePageNavSectionItem } from './ProfilePageNavSectionItem'
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
  const {
    data: supportedUsers = [],
    isSuccess,
    isLoading
  } = useSupportedUsers({
    userId: profile.user_id,
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

  const shouldShowSection =
    isLoading || (isSuccess && supportedUsers.length > 0)
  if (!shouldShowSection) return null

  const skeletonCount = Math.min(
    profile.supporting_count,
    MAX_PROFILE_SUPPORTING_TILES
  )

  return (
    <ProfilePageNavSectionItem>
      <ProfilePageNavSectionTitle
        title={messages.supporting}
        Icon={IconTipping}
      />
      {isLoading ? (
        Array(skeletonCount)
          .fill(null)
          .map((_, index) => <Skeleton key={index} h={122} borderRadius='m' />)
      ) : (
        <>
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
        </>
      )}
    </ProfilePageNavSectionItem>
  )
}

export const SupportingList = () => {
  const profile = useSelector(getProfileUser)
  return profile ? <SupportingListForProfile profile={profile} /> : null
}
