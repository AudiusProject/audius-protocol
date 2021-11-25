import React, {
  memo,
  useCallback,
  MouseEvent,
  useEffect,
  MutableRefObject,
  useMemo,
  useState
} from 'react'

import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import { SquareSizes } from 'common/models/ImageSizes'
import Status from 'common/models/Status'
import { User } from 'common/models/User'
import { getUsers } from 'common/store/cache/users/selectors'
import { formatCount } from 'common/utils/formatUtil'
import { Nullable } from 'common/utils/typeUtils'
import ArtistPopover from 'components/artist/ArtistPopover'
import UserListModal from 'components/artist/UserListModal'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Tooltip from 'components/tooltip/Tooltip'
import { fetchNotificationUsers } from 'containers/notification/store/actions'
import { getNotificationUserList } from 'containers/notification/store/selectors'
import { useUserProfilePicture } from 'hooks/useImageSize'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

import styles from './UserHeader.module.css'

export const UserImage = ({
  user,
  className,
  onProfileClick
}: {
  user: User
  onProfileClick: (handle: string) => void
  className?: string
}) => {
  const [loadImage, setLoadImage] = useState(false)
  const profilePicture = useUserProfilePicture(
    user.user_id,
    user._profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150,
    undefined,
    undefined,
    loadImage
  )

  // Loading the images immediately causes lag in the NotificationPanel animation
  useEffect(() => {
    if (!loadImage) {
      const t = setTimeout(() => {
        setLoadImage(true)
      }, 500)
      return () => clearTimeout(t)
    }
  }, [loadImage])

  const onClick = useCallback(
    e => {
      e.stopPropagation()
      onProfileClick(user.handle)
    },
    [onProfileClick, user.handle]
  )

  return (
    <ArtistPopover handle={user.handle}>
      <div onClick={onClick} className={className}>
        <DynamicImage
          wrapperClassName={styles.profilePictureWrapper}
          className={styles.profilePicture}
          image={profilePicture}
        />
      </div>
    </ArtistPopover>
  )
}

const USER_LENGTH_LIMIT = 10

type OwnProps = {
  id: string
  userIds: Array<ID>
  users: Array<User>
  isRead: boolean
  userListHeader: string
  userListModalVisible: boolean
  userListModalRef: MutableRefObject<Nullable<HTMLDivElement>>
  onOpenUserListModal: () => void
  onCloseUserListModal: () => void
  toggleNotificationPanel: () => void
  onProfileClick: (handle: string) => void
}

type UserHeaderProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const UserHeader = ({
  id,
  userIds,
  users,
  modalUsers,
  status,
  isRead,
  loadMore,
  userListHeader,
  hasMore,
  userListModalVisible,
  userListModalRef,
  onOpenUserListModal,
  onCloseUserListModal,
  toggleNotificationPanel,
  onProfileClick,
  goToRoute
}: UserHeaderProps) => {
  useEffect(() => {
    if (userListModalVisible) loadMore()
  }, [userListModalVisible, loadMore])

  const onClickContainer = useCallback(e => e.stopPropagation(), [])
  const goToProfileRoute = useCallback(
    (handle: string) => {
      goToRoute(profilePage(handle))
      toggleNotificationPanel()
    },
    [goToRoute, toggleNotificationPanel]
  )
  const showUserListModal = userIds.length > USER_LENGTH_LIMIT
  return (
    <div className={cn(styles.userHeader, { [styles.notRead]: !isRead })}>
      {users!
        .filter(u => !u.is_deactivated)
        .slice(0, showUserListModal ? USER_LENGTH_LIMIT - 1 : USER_LENGTH_LIMIT)
        .map(user => (
          <UserImage
            className={cn(styles.userImage, styles.userHeaderImage)}
            key={user.user_id}
            user={user}
            onProfileClick={onProfileClick}
          />
        ))}
      {showUserListModal && (
        <Tooltip text={'View All'} mount='body'>
          <div
            className={cn(styles.userImage, styles.userImageCount)}
            onClick={(evt: MouseEvent) => {
              evt.stopPropagation()
              onOpenUserListModal()
            }}
          >
            {`+${formatCount(userIds.length - USER_LENGTH_LIMIT + 1)}`}
          </div>
        </Tooltip>
      )}
      <div onClick={onClickContainer}>
        <UserListModal
          hasMore={hasMore}
          id={id}
          initialLoad={true}
          loading={status === Status.LOADING}
          loadMore={loadMore}
          onClickArtistName={goToProfileRoute}
          onClose={onCloseUserListModal}
          title={userListHeader}
          users={modalUsers}
          ref={userListModalRef}
          visible={userListModalVisible}
        />
      </div>
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
