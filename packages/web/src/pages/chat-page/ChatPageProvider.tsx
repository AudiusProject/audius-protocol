import { useEffect } from 'react'

import { RouteComponentProps } from 'react-router-dom'

import { useHistoryContext } from 'app/HistoryProvider'
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
  const { history } = useHistoryContext()

  // Replace the preset message in browser history after the first navigation
  useEffect(() => {
    if (presetMessage) {
      history.replace({ state: { presetMessage: undefined } })
    }
  }, [history, presetMessage])

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
