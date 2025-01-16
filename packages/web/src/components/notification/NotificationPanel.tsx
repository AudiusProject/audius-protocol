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
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { getIsOpen as getIsUserListOpen } from 'store/application/ui/userListModal/selectors'
import zIndex from 'utils/zIndex'

import { EmptyNotifications } from './EmptyNotifications'
import { Notification } from './Notification'
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
  isOpen: boolean
  onClose: () => void
}

// The threshold of distance from the bottom of the scroll container in the
// notification panel before requesting `loadMore` for more notifications
const SCROLL_THRESHOLD = 1000

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
export const NotificationPanel = ({
  anchorRef,
  isOpen,
  onClose
}: NotificationPanelProps) => {
  const { notifications, fetchNextPage, hasNextPage, isPending, isError } =
    useNotifications({ enabled: isOpen })
  const isUserListOpen = useSelector(getIsUserListOpen)
  const { mutate: markAsViewed } = useMarkNotificationsAsViewed()

  const panelRef = useRef<Nullable<HTMLDivElement>>(null)

  const handleCheckClickInside = useCallback(
    (target: EventTarget) => {
      if (isUserListOpen) return true
      if (target instanceof Element && anchorRef.current) {
        return anchorRef.current.contains(target)
      }
      return false
    },
    [isUserListOpen, anchorRef]
  )

  useEffect(() => {
    if (isOpen) {
      markAsViewed()
    }
  }, [isOpen, markAsViewed])

  const userHasNoNotifications =
    (!isPending || isError) && notifications.length === 0

  return (
    <Popup
      anchorRef={anchorRef}
      isVisible={isOpen}
      checkIfClickInside={handleCheckClickInside}
      onClose={onClose}
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
            initialLoad={isPending}
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
  )
}
