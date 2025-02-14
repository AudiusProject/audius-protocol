import { useRef, useCallback, useEffect, RefObject } from 'react'

import { Status } from '@audius/common/models'
import {
  notificationsActions,
  notificationsSelectors,
  Notification as Notifications
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import {
  Scrollbar,
  IconNotificationOn as IconNotification,
  Popup,
  Flex,
  Text
} from '@audius/harmony'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParam } from 'react-use'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import {
  getModalNotification,
  getNotificationModalIsOpen,
  getNotificationPanelIsOpen
} from 'store/application/ui/notifications/notificationsUISelectors'
import {
  closeNotificationModal,
  closeNotificationPanel,
  openNotificationPanel
} from 'store/application/ui/notifications/notificationsUISlice'
import { getIsOpen as getIsUserListOpen } from 'store/application/ui/userListModal/selectors'
import zIndex from 'utils/zIndex'

import { EmptyNotifications } from './EmptyNotifications'
import { Notification } from './Notification'
import { NotificationModal } from './NotificationModal'
import styles from './NotificationPanel.module.css'
const { fetchNotifications } = notificationsActions
const {
  getNotificationHasMore,
  getNotificationStatus,
  selectAllNotifications
} = notificationsSelectors

const { getNotificationUnviewedCount } = notificationsSelectors
const { markAllAsViewed } = notificationsActions

const scrollbarId = 'notificationsPanelScroll'

const getScrollParent = () => {
  const scrollbarElement = window.document.getElementById(scrollbarId)
  return scrollbarElement || null
}

const messages = {
  title: 'Notifications'
}

type NotificationPanelProps = {
  anchorRef: RefObject<HTMLButtonElement>
}

// The threshold of distance from the bottom of the scroll container in the
// notification panel before requesting `loadMore` for more notifications
const SCROLL_THRESHOLD = 1000

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
export const NotificationPanel = ({ anchorRef }: NotificationPanelProps) => {
  const panelIsOpen = useSelector(getNotificationPanelIsOpen)
  const notifications = useSelector(selectAllNotifications)
  const hasMore = useSelector(getNotificationHasMore)
  const status = useSelector(getNotificationStatus)
  const isNotificationModalOpen = useSelector(getNotificationModalIsOpen)
  const modalNotification = useSelector(getModalNotification)
  const isUserListOpen = useSelector(getIsUserListOpen)
  const unviewedNotificationCount = useSelector(getNotificationUnviewedCount)

  const panelRef = useRef<Nullable<HTMLDivElement>>(null)

  const dispatch = useDispatch()
  const openNotifications = useSearchParam('openNotifications')

  const handleCloseNotificationModal = useCallback(() => {
    dispatch(closeNotificationModal())
  }, [dispatch])

  const handleLoadMore = useCallback(() => {
    if (!hasMore || status === Status.LOADING || status === Status.ERROR) return
    dispatch(fetchNotifications())
  }, [hasMore, status, dispatch])

  const handleCloseNotificationPanel = useCallback(() => {
    dispatch(closeNotificationPanel())
  }, [dispatch])

  const handleCheckClickInside = useCallback(
    (target: EventTarget) => {
      if (isUserListOpen || isNotificationModalOpen) return true
      if (target instanceof Element && anchorRef.current) {
        return anchorRef.current.contains(target)
      }
      return false
    },
    [isUserListOpen, isNotificationModalOpen, anchorRef]
  )

  useEffect(() => {
    if (openNotifications) {
      dispatch(openNotificationPanel())
    }
  }, [openNotifications, dispatch])

  useEffect(() => {
    if (panelIsOpen && unviewedNotificationCount > 0) {
      return () => {
        dispatch(markAllAsViewed())
      }
    }
  }, [panelIsOpen, unviewedNotificationCount, dispatch])

  const userHasNoNotifications =
    (status === Status.SUCCESS || status === Status.ERROR) &&
    notifications.length === 0

  return (
    <>
      <Popup
        anchorRef={anchorRef}
        isVisible={panelIsOpen}
        checkIfClickInside={handleCheckClickInside}
        onClose={handleCloseNotificationPanel}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        shadow='emphasis'
        zIndex={zIndex.NAVIGATOR_POPUP}
      >
        <Flex
          backgroundColor='white'
          column
          borderRadius='m'
          w={428}
          ref={panelRef}
        >
          <Flex
            inline
            justifyContent='center'
            alignItems='center'
            backgroundColor='accent'
            borderBottom='default'
            borderTopLeftRadius='m'
            borderTopRightRadius='m'
            p='s'
            gap='s'
          >
            <IconNotification color='white' size='xl' />
            <Text
              variant='label'
              size='xl'
              strength='strong'
              color='white'
              lineHeight='single'
            >
              {messages.title}
            </Text>
          </Flex>
          <Scrollbar className={styles.scrollContent} id={scrollbarId}>
            <InfiniteScroll
              loadMore={handleLoadMore}
              hasMore={hasMore}
              initialLoad={status === Status.IDLE}
              useWindow={false}
              threshold={SCROLL_THRESHOLD}
              loader={
                <LoadingSpinner
                  key='loading-spinner'
                  className={styles.spinner}
                />
              }
              getScrollParent={getScrollParent}
              className={styles.content}
              element='ul'
            >
              {userHasNoNotifications ? (
                <EmptyNotifications />
              ) : (
                notifications.map((notification: Notifications) => {
                  return (
                    <Notification
                      key={notification.id}
                      notification={notification}
                    />
                  )
                })
              )}
            </InfiniteScroll>
          </Scrollbar>
        </Flex>
      </Popup>
      <NotificationModal
        isOpen={isNotificationModalOpen}
        notification={modalNotification}
        onClose={handleCloseNotificationModal}
      />
    </>
  )
}
