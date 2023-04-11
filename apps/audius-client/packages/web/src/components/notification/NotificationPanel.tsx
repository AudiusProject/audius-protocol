import { useRef, useCallback, useEffect, MutableRefObject } from 'react'

import {
  Status,
  Nullable,
  notificationsSelectors,
  Notification as Notifications,
  notificationsActions
} from '@audius/common'
import { Popup, PopupPosition, Scrollbar } from '@audius/stems'
import cn from 'classnames'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParam } from 'react-use'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ReactComponent as IconNotification } from 'assets/img/iconNotification.svg'
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
  getNotificationHasLoaded,
  getNotificationHasMore,
  getNotificationStatus,
  makeGetAllNotifications
} = notificationsSelectors

const { getNotificationUnviewedCount } = notificationsSelectors
const { markAllAsViewed } = notificationsActions

const getNotifications = makeGetAllNotifications()

const scrollbarId = 'notificationsPanelScroll'

const getScrollParent = () => {
  const scrollbarElement = window.document.getElementById(scrollbarId)
  return scrollbarElement || null
}

const messages = {
  title: 'Notifications',
  empty: 'There’s Nothing Here Yet!',
  readMore: 'Read More'
}

type NotificationPanelProps = {
  anchorRef: MutableRefObject<HTMLElement>
}

// The threshold of distance from the bottom of the scroll container in the
// notification panel before requesting `loadMore` for more notifications
const SCROLL_THRESHOLD = 1000

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
export const NotificationPanel = ({ anchorRef }: NotificationPanelProps) => {
  const panelIsOpen = useSelector(getNotificationPanelIsOpen)
  const notifications = useSelector(getNotifications)
  const hasLoaded = useSelector(getNotificationHasLoaded)
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

  const loadMore = useCallback(() => {
    if (!hasMore || status === Status.LOADING || status === Status.ERROR) return
    dispatch(fetchNotifications())
  }, [hasMore, status, dispatch])

  const handleCloseNotificationPanel = useCallback(() => {
    dispatch(closeNotificationPanel())
  }, [dispatch])

  const handleCheckClickInside = useCallback(
    (target: EventTarget) => {
      if (isUserListOpen || isNotificationModalOpen) return true
      if (target instanceof Element) {
        return anchorRef?.current.contains(target)
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
    if (unviewedNotificationCount > 0) {
      dispatch(markAllAsViewed())
    }
  }, [unviewedNotificationCount, dispatch])

  return (
    <>
      <Popup
        anchorRef={anchorRef}
        className={styles.popup}
        isVisible={panelIsOpen}
        checkIfClickInside={handleCheckClickInside}
        onClose={handleCloseNotificationPanel}
        position={PopupPosition.BOTTOM_RIGHT}
        wrapperClassName={styles.popupWrapper}
        zIndex={zIndex.NAVIGATOR_POPUP}
      >
        <div className={styles.panelContainer} ref={panelRef}>
          <div className={styles.header}>
            <IconNotification className={styles.iconNotification} />
            <h3 className={styles.title}>{messages.title}</h3>
          </div>
          {!hasLoaded ? (
            <div className={cn(styles.notLoaded, styles.spinnerContainer)}>
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: loadingSpinner
                }}
              />
            </div>
          ) : null}
          {hasLoaded && notifications.length > 0 ? (
            <Scrollbar className={styles.scrollContent} id={scrollbarId}>
              <InfiniteScroll
                pageStart={0}
                loadMore={loadMore}
                hasMore={hasMore}
                useWindow={false}
                initialLoad={false}
                threshold={SCROLL_THRESHOLD}
                getScrollParent={getScrollParent}
              >
                <div className={styles.content}>
                  {notifications.map((notification: Notifications) => {
                    return (
                      <Notification
                        key={notification.id}
                        notification={notification}
                      />
                    )
                  })}
                  {status === Status.LOADING ? (
                    <div className={styles.spinnerContainer} key={'loading'}>
                      <Lottie
                        options={{
                          loop: true,
                          autoplay: true,
                          animationData: loadingSpinner
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </InfiniteScroll>
            </Scrollbar>
          ) : null}
          {hasLoaded && notifications.length === 0 ? (
            <EmptyNotifications />
          ) : null}
        </div>
      </Popup>
      <NotificationModal
        isOpen={isNotificationModalOpen}
        notification={modalNotification}
        onClose={handleCloseNotificationModal}
      />
    </>
  )
}
