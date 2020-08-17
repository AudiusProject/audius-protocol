import React, { useEffect, useCallback, useContext } from 'react'
import Lottie from 'react-lottie'
import loadingSpinner from 'assets/animations/loadingSpinner.json'

import { ID } from 'models/common/Identifiers'
import InfiniteScroll from 'react-infinite-scroller'
import styles from './NotificationPage.module.css'
import EmptyNotifications from './components/EmptyNotifications'
import NotificationProvider from './NotificationProvider'

import NavContext, { LeftPreset } from 'containers/nav/store/context'
import ConnectedNotification from './components/mobile/ConnectedNotification'
import MobilePageContainer from 'components/general/MobilePageContainer'
import { Notification } from './store/types'
import { Status } from 'store/types'
import NetworkConnectivityMonitor from 'containers/network-connectivity/NetworkConnectivityMonitor'

const messages = {
  documentTitle: 'Notifications',
  description: 'View your notifications on Audius',
  title: 'NOTIFICATIONS',
  empty: 'There’s Nothing Here Yet!',
  readMore: 'Read More'
}

type OwnProps = {
  status: Status
  hasMore: boolean
  notifications: any
  modalIsOpen: boolean
  panelIsOpen: boolean

  setNotificationUsers: (userIds: ID[], limit: number) => void
  goToRoute: (route: string) => void
  hideNotification: (notificationId: string) => void
  markAsRead: (notificationId: string) => void
  markAllAsViewed: () => void
  unsubscribeUser: (userId: ID) => void
  fetchNotifications: (limit?: number) => void
}

type NotificationPageProps = OwnProps

// The threshold of distance from the bottom of the scroll container in the
// notification panel before requesting `loadMore` for more notifications
const SCROLL_THRESHOLD = 300

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
const NotificationPage = ({
  notifications,
  goToRoute,
  markAllAsViewed,
  markAsRead,
  hasMore,
  status,
  unsubscribeUser,
  fetchNotifications,
  setNotificationUsers,
  hideNotification
}: NotificationPageProps) => {
  useEffect(() => {
    markAllAsViewed()
  }, [markAllAsViewed])

  const loadMore = useCallback(() => {
    if (!hasMore || status === Status.LOADING || status === Status.ERROR) return
    fetchNotifications()
  }, [hasMore, status, fetchNotifications])

  return (
    <NetworkConnectivityMonitor pageDidLoad={status !== Status.LOADING}>
      <MobilePageContainer
        title={messages.documentTitle}
        description={messages.description}
        backgroundClassName={styles.background}
        fullHeight
      >
        <div className={styles.notificationContainer}>
          {notifications.length > 0 ? (
            <InfiniteScroll
              pageStart={0}
              loadMore={loadMore}
              hasMore={true}
              useWindow={true}
              initialLoad={false}
              threshold={SCROLL_THRESHOLD}
            >
              <div className={styles.content}>
                {notifications
                  .filter(({ isHidden }: any) => !isHidden)
                  .map((notification: Notification, key: number) => {
                    return (
                      <ConnectedNotification
                        key={key}
                        goToRoute={goToRoute}
                        setNotificationUsers={setNotificationUsers}
                        notification={notification}
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
          ) : (
            <EmptyNotifications />
          )}
        </div>
      </MobilePageContainer>
    </NetworkConnectivityMonitor>
  )
}

const NotificationPageWrapped = (props: any) => {
  // Set Nav-Bar Menu
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.CLOSE)
    setRight(null)
    setCenter(messages.title)
  }, [setLeft, setCenter, setRight])

  return (
    <NotificationProvider {...props}>{NotificationPage}</NotificationProvider>
  )
}

export default NotificationPageWrapped
