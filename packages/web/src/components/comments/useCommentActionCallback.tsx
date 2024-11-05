import { useCallback } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { Name } from '@audius/common/models'
import { useLocation } from 'react-router-dom'
import { useToggle } from 'react-use'

import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import { make, track } from 'services/analytics'

export const useCommentActionCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
) => {
  const isMobile = useIsMobile()
  const location = useLocation()
  const { currentUserId, entityId } = useCurrentCommentSection()
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)
  const { requiresAccount } = useRequiresAccountCallback(
    isMobile ? location.pathname : `${location.pathname}?showComments=true`
  )

  const wrappedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (isMobile) {
        toggleIsMobileAppDrawer()
        track(
          make({
            eventName: Name.COMMENTS_OPEN_INSTALL_APP_MODAL,
            trackId: entityId
          })
        )
      } else {
        if (!currentUserId) {
          requiresAccount()
          track(
            make({
              eventName: Name.COMMENTS_OPEN_AUTH_MODAL,
              trackId: entityId
            })
          )
        } else {
          // eslint-disable-next-line n/no-callback-literal
          return callback(...args)
        }
      }
    },
    [
      callback,
      isMobile,
      toggleIsMobileAppDrawer,
      entityId,
      currentUserId,
      requiresAccount,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ...deps
    ]
  )

  const downloadMobileAppDrawer = isMobile ? (
    <DownloadMobileAppDrawer
      isOpen={isMobileAppDrawerOpen}
      onClose={toggleIsMobileAppDrawer}
    />
  ) : null

  return [wrappedCallback, downloadMobileAppDrawer] as const
}
