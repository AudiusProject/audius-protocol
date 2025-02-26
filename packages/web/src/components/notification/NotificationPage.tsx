import { useEffect, useCallback, useContext } from 'react'

import { Status } from '@audius/common/models'
import {
  notificationsActions,
  notificationsSelectors,
  Notification as Notifications
} from '@audius/common/store'
import { Flex } from '@audius/harmony'
import Lottie from 'lottie-react'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch, useSelector } from 'react-redux'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'

import { EmptyNotifications } from './EmptyNotifications'
import { Notification } from './Notification'
const { fetchNotifications, markAllAsViewed } = notificationsActions
const {
  getNotificationHasMore,
  getNotificationStatus,
  selectAllNotifications,
  getNotificationUnviewedCount
} = notificationsSelectors

const messages = {
  documentTitle: 'Notifications',
  description: 'View your notifications on Audius',
  title: 'NOTIFICATIONS'
}

// The threshold of distance from the bottom of the scroll container in the
// notification panel before requesting `loadMore` for more notifications
const SCROLL_THRESHOLD = 300

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
export const NotificationPage = () => {
  const notifications = useSelector(selectAllNotifications)
  const hasMore = useSelector(getNotificationHasMore)
  const status = useSelector(getNotificationStatus)
  const notificationUnviewedCount = useSelector(getNotificationUnviewedCount)
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

  useEffect(() => {
    if (notificationUnviewedCount > 0) {
      dispatch(markAllAsViewed())
    }
  }, [dispatch, notificationUnviewedCount])

  return (
    <MobilePageContainer
      title={messages.documentTitle}
      description={messages.description}
      fullHeight
    >
      {notifications.length > 0 ? (
        <Flex
          as={InfiniteScroll}
          direction='column'
          p='l'
          backgroundColor='default'
          gap='s'
          // @ts-ignore
          pageStart={0}
          loadMore={loadMore}
          hasMore={true}
          useWindow={true}
          initialLoad={false}
          threshold={SCROLL_THRESHOLD}
          element='ul'
          css={{ listStyleType: 'none', textAlign: 'left' }}
        >
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
            <Flex alignItems='center' justifyContent='center' pt='l'>
              <Lottie loop autoplay animationData={loadingSpinner} />
            </Flex>
          )}
        </Flex>
      ) : (
        <EmptyNotifications />
      )}
    </MobilePageContainer>
  )
}
