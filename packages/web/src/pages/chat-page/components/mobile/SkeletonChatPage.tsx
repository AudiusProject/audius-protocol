import { useCallback, useEffect, useState } from 'react'

import { useDispatch } from 'react-redux'

import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import { goBack } from 'utils/navigation'

import { SkeletonChatListItem } from '../SkeletonChatListItem'

export const SkeletonChatPage = () => {
  const dispatch = useDispatch()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleClose = useCallback(() => {
    dispatch(goBack())
  }, [dispatch])

  // Setting the drawer to be visible on initial render stops the animation for some reason,
  // so give it a frame to render first
  useEffect(() => {
    setTimeout(() => setIsDrawerOpen(true), 0)
  }, [setIsDrawerOpen])

  return (
    <>
      <SkeletonChatListItem />
      <SkeletonChatListItem style={{ opacity: 0.9 }} />
      <SkeletonChatListItem style={{ opacity: 0.8 }} />
      <SkeletonChatListItem style={{ opacity: 0.7 }} />
      <SkeletonChatListItem style={{ opacity: 0.6 }} />
      <SkeletonChatListItem style={{ opacity: 0.5 }} />
      <SkeletonChatListItem style={{ opacity: 0.4 }} />
      <SkeletonChatListItem style={{ opacity: 0.3 }} />
      <SkeletonChatListItem style={{ opacity: 0.2 }} />
      <SkeletonChatListItem style={{ opacity: 0.1 }} />
      <DownloadMobileAppDrawer isOpen={isDrawerOpen} onClose={handleClose} />
    </>
  )
}
