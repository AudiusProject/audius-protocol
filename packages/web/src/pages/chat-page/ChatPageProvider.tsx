import { RouteComponentProps } from 'react-router-dom'

import { useIsMobile } from 'hooks/useIsMobile'
import { useManagedAccountNotAllowedRedirect } from 'hooks/useManagedAccountNotAllowedRedirect'

import { ChatPage as DesktopChatPage } from './ChatPage'
import { SkeletonChatPage as MobileChatPage } from './components/mobile/SkeletonChatPage'

export const ChatPageProvider = ({
  match,
  location
}: RouteComponentProps<
  { id?: string },
  any,
  { presetMessage?: string } | undefined
>) => {
  useManagedAccountNotAllowedRedirect()
  const currentChatId = match.params.id
  const presetMessage = location.state?.presetMessage
  const isMobile = useIsMobile()

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
