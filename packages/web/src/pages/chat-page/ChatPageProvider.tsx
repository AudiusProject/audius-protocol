import { useEffect } from 'react'

import { useNavigate, useParams, useLocation, Location } from 'react-router-dom'

import { useIsMobile } from 'hooks/useIsMobile'
import { useManagedAccountNotAllowedRedirect } from 'hooks/useManagedAccountNotAllowedRedirect'

import { ChatPage as DesktopChatPage } from './ChatPage'
import { SkeletonChatPage as MobileChatPage } from './components/mobile/SkeletonChatPage'

export const ChatPageProvider = () => {
  useManagedAccountNotAllowedRedirect()
  const params = useParams<{ id?: string }>()
  const location = useLocation() as Location<{ presetMessage?: string }>
  const navigate = useNavigate()
  const { id: currentChatId } = params
  const presetMessage = location.state?.presetMessage

  const isMobile = useIsMobile()

  // Replace the preset message in browser history after the first navigation
  useEffect(() => {
    if (presetMessage) {
      navigate(location.pathname, {
        replace: true,
        state: { presetMessage: undefined }
      })
    }
  }, [navigate, location.pathname, presetMessage])

  if (isMobile) {
    return <MobileChatPage />
  }
  return (
    <DesktopChatPage
      currentChatId={currentChatId}
      presetMessage={presetMessage}
    />
  )
}
