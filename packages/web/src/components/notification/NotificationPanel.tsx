import { useRef, useCallback, useEffect, RefObject } from 'react'

import {
  useMarkNotificationsAsViewed,
  useNotifications
} from '@audius/common/api'
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
  const { notifications, fetchNextPage, hasNextPage, isLoading, isError } =
    useNotifications({ enabled: panelIsOpen })
  const isNotificationModalOpen = useSelector(getNotificationModalIsOpen)
  const modalNotification = useSelector(getModalNotification)
  const isUserListOpen = useSelector(getIsUserListOpen)
  const { mutate: markAsViewed } = useMarkNotificationsAsViewed()

  const panelRef = useRef<Nullable<HTMLDivElement>>(null)

  const dispatch = useDispatch()
  const openNotifications = useSearchParam('openNotifications')

  const handleCloseNotificationModal = useCallback(() => {
    dispatch(closeNotificationModal())
  }, [dispatch])

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
    if (panelIsOpen) {
      markAsViewed()
    }
  }, [panelIsOpen, markAsViewed])

  const userHasNoNotifications =
    (!isLoading || isError) && notifications.length === 0

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
            <IconNotification color='staticWhite' size='xl' />
            <Text
              variant='label'
              size='xl'
              strength='strong'
              color='staticWhite'
              lineHeight='single'
            >
              {messages.title}
            </Text>
          </Flex>
          <Scrollbar className={styles.scrollContent} id={scrollbarId}>
            <InfiniteScroll
              loadMore={() => fetchNextPage()}
              hasMore={hasNextPage}
              initialLoad={!notifications.length}
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
                notifications.map((notification) => {
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
