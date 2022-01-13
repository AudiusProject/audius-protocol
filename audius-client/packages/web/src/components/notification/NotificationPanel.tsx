import React, { useRef, useCallback } from 'react'

import { Popup, PopupPosition } from '@audius/stems'
import cn from 'classnames'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'
import SimpleBar from 'simplebar-react'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ID } from 'common/models/Identifiers'
import Status from 'common/models/Status'
import { Nullable } from 'common/utils/typeUtils'
import zIndex from 'utils/zIndex'

import styles from './NotificationPanel.module.css'
import NotificationProvider from './NotificationProvider'
import EmptyNotifications from './components/EmptyNotifications'
import NotificationItem from './components/desktop/Notification'
import NotificationModal from './components/desktop/NotificationModal'
import { Notification } from './store/types'

const messages = {
  title: 'Notifications',
  markAllRead: 'Mark All Read',
  empty: 'There’s Nothing Here Yet!',
  readMore: 'Read More'
}

type OwnProps = {
  anchorRef: React.MutableRefObject<HTMLElement>
  hasLoaded: boolean
  toggleNotificationPanel: () => void
  isElectron: boolean
  status: Status
  hasMore: boolean
  notifications: Notification[]
  modalIsOpen: boolean
  panelIsOpen: boolean
  modalNotification: Notification | null

  setNotificationUsers: (userIds: ID[], limit: number) => void
  goToRoute: (route: string) => void
  hideNotification: (notificationId: string) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  unsubscribeUser: (userId: ID) => void
  fetchNotifications: (limit?: number) => void
  setNotificationModal: (open: boolean, notificationId?: string) => void
}

type NotificationPanelProps = OwnProps

// The threshold of distance from the bottom of the scroll container in the
// notification panel before requesting `loadMore` for more notifications
const SCROLL_THRESHOLD = 1000

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
const NotificationPanel = ({
  anchorRef,
  hasLoaded,
  modalIsOpen,
  panelIsOpen,
  modalNotification,
  notifications,
  goToRoute,
  markAsRead,
  markAllAsRead,
  toggleNotificationPanel,
  setNotificationModal,
  isElectron,
  hasMore,
  status,
  unsubscribeUser,
  fetchNotifications,
  setNotificationUsers,
  hideNotification
}: NotificationPanelProps) => {
  const panelRef = useRef<Nullable<HTMLDivElement>>(null)
  const scrollRef = useRef<Nullable<HTMLDivElement>>(null)
  const overflowMenuRef = useRef<Nullable<HTMLDivElement>>(null)
  const userListModalRef = useRef<Nullable<HTMLDivElement>>(null)
  const simpleBarId = 'notificationsPanelScroll'
  const getScrollParent = () => {
    const simpleBarElement = window.document.getElementById(simpleBarId)
    return simpleBarElement || null
  }

  const setSimpleBarRef = useCallback(el => {
    el.recalculate()
  }, [])
  const onCloseNotificationModal = useCallback(() => {
    setNotificationModal(false)
  }, [setNotificationModal])

  const loadMore = useCallback(() => {
    if (!hasMore || status === Status.LOADING || status === Status.ERROR) return
    fetchNotifications()
  }, [hasMore, status, fetchNotifications])

  return (
    <Popup
      anchorRef={anchorRef}
      className={styles.popup}
      isVisible={panelIsOpen}
      checkIfClickInside={(target: EventTarget) => {
        if (target instanceof Element) {
          return [
            anchorRef?.current,
            overflowMenuRef?.current,
            userListModalRef?.current
          ].some(r => r?.contains(target))
        }
        return false
      }}
      onClose={toggleNotificationPanel}
      position={PopupPosition.BOTTOM_RIGHT}
      wrapperClassName={styles.popupWrapper}
      zIndex={zIndex.NAVIGATOR_POPUP}
    >
      <>
        <div className={styles.panelContainer} ref={panelRef}>
          <div className={styles.header}>
            <div className={styles.title}> {messages.title} </div>
            <div className={styles.markAllRead} onClick={markAllAsRead}>
              {messages.markAllRead}
            </div>
          </div>
          {!hasLoaded && (
            <div className={cn(styles.notLoaded, styles.spinnerContainer)}>
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: loadingSpinner
                }}
              />
            </div>
          )}
          {hasLoaded && notifications.length > 0 && (
            <SimpleBar
              className={styles.scrollContent}
              ref={setSimpleBarRef}
              scrollableNodeProps={{ id: simpleBarId, ref: scrollRef }}
            >
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
                  {notifications
                    .filter(({ isHidden }: any) => !isHidden)
                    .map((notification: Notification, key: number) => {
                      return (
                        <NotificationItem
                          key={key}
                          goToRoute={goToRoute}
                          setNotificationUsers={setNotificationUsers}
                          toggleNotificationPanel={toggleNotificationPanel}
                          notification={notification}
                          overflowMenuRef={overflowMenuRef}
                          userListModalRef={userListModalRef}
                          panelRef={panelRef}
                          scrollRef={scrollRef}
                          setNotificationModal={setNotificationModal}
                          markAsRead={markAsRead}
                          unsubscribeUser={unsubscribeUser}
                          hideNotification={hideNotification}
                        />
                      )
                    })}
                  {status === Status.LOADING && (
                    <div className={styles.spinnerContainer} key={'loading'}>
                      <Lottie
                        options={{
                          loop: true,
                          autoplay: true,
                          animationData: loadingSpinner
                        }}
                      />
                    </div>
                  )}
                </div>
              </InfiniteScroll>
            </SimpleBar>
          )}
          {hasLoaded && notifications.length === 0 && <EmptyNotifications />}
        </div>
        <NotificationModal
          isOpen={modalIsOpen}
          notification={modalNotification}
          onClose={onCloseNotificationModal}
        />
      </>
    </Popup>
  )
}

const NotificationPanelWrapped = (props: any) => {
  return (
    <NotificationProvider {...props}>{NotificationPanel}</NotificationProvider>
  )
}

export default NotificationPanelWrapped
