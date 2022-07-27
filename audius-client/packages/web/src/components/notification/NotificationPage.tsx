import { useEffect, useCallback, useContext } from 'react'

import { Status } from '@audius/common'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'
import { useDispatch, useSelector } from 'react-redux'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { fetchNotifications } from 'common/store/notifications/actions'
import {
  getNotificationHasMore,
  getNotificationStatus,
  makeGetAllNotifications
} from 'common/store/notifications/selectors'
import { Notification as Notifications } from 'common/store/notifications/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import NetworkConnectivityMonitor from 'components/network-connectivity/NetworkConnectivityMonitor'

import { EmptyNotifications } from './EmptyNotifications'
import { Notification } from './Notification'
import styles from './NotificationPage.module.css'

const getNotifications = makeGetAllNotifications()

const messages = {
  documentTitle: 'Notifications',
  description: 'View your notifications on Audius',
  title: 'NOTIFICATIONS',
  empty: 'There’s Nothing Here Yet!',
  readMore: 'Read More'
}

// The threshold of distance from the bottom of the scroll container in the
// notification panel before requesting `loadMore` for more notifications
const SCROLL_THRESHOLD = 300

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
export const NotificationPage = () => {
  const notifications = useSelector(getNotifications)
  const hasMore = useSelector(getNotificationHasMore)
  const status = useSelector(getNotificationStatus)
  const dispatch = useDispatch()

  const loadMore = useCallback(() => {
    if (!hasMore || status === Status.LOADING || status === Status.ERROR) return
    dispatch(fetchNotifications())
  }, [hasMore, status, dispatch])

  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.CLOSE)
    setRight(null)
    setCenter(messages.title)
  }, [setLeft, setCenter, setRight])

  return (
    <NetworkConnectivityMonitor pageDidLoad={status !== Status.LOADING}>
      <MobilePageContainer
        title={messages.documentTitle}
        description={messages.description}
        backgroundClassName={styles.background}
        fullHeight>
        <div className={styles.notificationContainer}>
          {notifications.length > 0 ? (
            <InfiniteScroll
              pageStart={0}
              loadMore={loadMore}
              hasMore={true}
              useWindow={true}
              initialLoad={false}
              threshold={SCROLL_THRESHOLD}>
              <div className={styles.content}>
                {notifications
                  .filter(({ isHidden }: any) => !isHidden)
                  .map((notification: Notifications) => {
                    return (
                      <Notification
                        key={notification.id}
                        notification={notification}
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
