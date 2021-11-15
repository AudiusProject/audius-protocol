import React, { memo, useState, useCallback } from 'react'

import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import { SquareSizes } from 'common/models/ImageSizes'
import { User } from 'common/models/User'
import { getUsers } from 'common/store/cache/users/selectors'
import { formatCount } from 'common/utils/formatUtil'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { fetchNotificationUsers } from 'containers/notification/store/actions'
import { getNotificationUserList } from 'containers/notification/store/selectors'
import { useUserProfilePicture } from 'hooks/useImageSize'
import { AppState } from 'store/types'

import styles from './UserHeader.module.css'

export const UserImage = ({
  user,
  className
}: {
  user: User
  className?: string
}) => {
  const profilePicture = useUserProfilePicture(
    user.user_id,
    user._profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={className}>
      <DynamicImage
        wrapperClassName={styles.profilePictureWrapper}
        className={styles.profilePicture}
        image={profilePicture}
      />
    </div>
  )
}

// Width of a User Image + spacing
const USER_IMG_WIDTH = 29
const calcUserImgCount = (width: number) => {
  return Math.floor(width / USER_IMG_WIDTH)
}

type OwnProps = {
  userIds: Array<ID>
  users: Array<User>
  isRead: boolean
  goToUserListPage: () => void
}

type UserHeaderProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const UserHeader = ({
  userIds,
  users,
  isRead,
  goToUserListPage
}: UserHeaderProps) => {
  const [userImgCount, setUserImgCount] = useState<number>(0)
  const showUserListModal = userIds.length > userImgCount
  const measuredRef = useCallback(node => {
    if (node !== null) {
      const containerWidth = node.getBoundingClientRect().width
      const imgCount = calcUserImgCount(containerWidth)
      setUserImgCount(imgCount)
    }
  }, [])
  return (
    <div
      className={cn(styles.userHeader, { [styles.notRead]: !isRead })}
      onClick={goToUserListPage}
      ref={measuredRef}
    >
      {users!
        .slice(0, showUserListModal ? userImgCount - 1 : userImgCount)
        .map((user: any) => (
          <UserImage
            className={cn(styles.userImage, styles.userHeaderImage)}
            key={user.user_id}
            user={user}
          />
        ))}
      {showUserListModal && (
        <div className={cn(styles.userImage, styles.userImageCount)}>
          {`+${formatCount(userIds.length - userImgCount + 1)}`}
        </div>
      )}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  const { limit, userIds, status } = getNotificationUserList(state)
  const users = getUsers(state, { ids: userIds })
  return {
    modalUsers: userIds.slice(0, limit).map(id => users[id]),
    hasMore: userIds.length > limit,
    status
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    loadMore: (limit?: number) => dispatch(fetchNotificationUsers(limit))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(memo(UserHeader))
