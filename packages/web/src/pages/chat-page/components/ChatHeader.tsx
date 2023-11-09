import { forwardRef, useCallback, useState } from 'react'

import {
  useProxySelector,
  chatSelectors,
  User,
  useCreateChatModal
} from '@audius/common'
import {
  IconButton,
  IconCompose,
  IconSettings,
  IconKebabHorizontal,
  PopupMenu,
  IconBlockMessages,
  IconUnblockMessages,
  IconUser,
  IconTrash,
  IconError
} from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { HeaderGutter } from 'components/header/desktop/HeaderGutter'
import { profilePage } from 'utils/route'

import { BlockUserConfirmationModal } from './BlockUserConfirmationModal'
import styles from './ChatHeader.module.css'
import { ChatUser } from './ChatUser'
import { DeleteChatConfirmationModal } from './DeleteChatConfirmationModal'
import { UnblockUserConfirmationModal } from './UnblockUserConfirmationModal'

const messages = {
  header: 'Messages',
  settings: 'Settings',
  compose: 'Compose',
  chatSettings: 'Chat Settings',
  block: 'Block Messages',
  unblock: 'Unblock Messages',
  report: 'Report Abuse',
  delete: 'Delete Conversation',
  visit: "Visit User's Profile"
}

const { getOtherChatUsers, getBlockees } = chatSelectors

type ChatHeaderProps = {
  currentChatId?: string
  isChromeOrSafari?: boolean
  scrollBarWidth?: number
  headerContainerRef?: React.RefObject<HTMLDivElement>
}

export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(
  (
    { currentChatId, isChromeOrSafari, scrollBarWidth, headerContainerRef },
    ref
  ) => {
    const dispatch = useDispatch()
    const { onOpen: openCreateChatModal } = useCreateChatModal()
    const [, setInboxSettingsVisible] = useModalState('InboxSettings')
    const [isUnblockUserModalVisible, setIsUnblockUserModalVisible] =
      useState(false)
    const [isBlockUserModalVisible, setIsBlockUserModalVisible] =
      useState(false)
    const [isReportAbuse, setIsReportAbuse] = useState(false)
    const [isDeleteChatModalVisible, setIsDeleteChatModalVisible] =
      useState(false)
    const users = useProxySelector(
      (state) => getOtherChatUsers(state, currentChatId),
      [currentChatId]
    )
    const user: User | null = users[0] ?? null
    const blockeeList = useSelector(getBlockees)
    const isBlocked = user && blockeeList.includes(user.user_id)

    const handleComposeClicked = useCallback(() => {
      openCreateChatModal()
    }, [openCreateChatModal])

    const handleSettingsClicked = useCallback(() => {
      setInboxSettingsVisible(true)
    }, [setInboxSettingsVisible])

    const handleUnblockClicked = useCallback(() => {
      setIsUnblockUserModalVisible(true)
    }, [setIsUnblockUserModalVisible])

    const handleBlockClicked = useCallback(() => {
      setIsBlockUserModalVisible(true)
    }, [setIsBlockUserModalVisible])

    const handleReportClicked = useCallback(() => {
      setIsReportAbuse(true)
      setIsBlockUserModalVisible(true)
    }, [setIsReportAbuse])

    const handleCloseBlockModal = useCallback(() => {
      setIsReportAbuse(false)
      setIsBlockUserModalVisible(false)
    }, [setIsReportAbuse])

    const handleVisitClicked = useCallback(() => {
      dispatch(pushRoute(profilePage(user.handle)))
    }, [dispatch, user])

    const handleDeleteClicked = useCallback(() => {
      setIsDeleteChatModalVisible(true)
    }, [setIsDeleteChatModalVisible])

    const overflowItems = [
      {
        text: messages.delete,
        icon: <IconTrash />,
        onClick: handleDeleteClicked
      },
      {
        text: messages.visit,
        icon: <IconUser />,
        onClick: handleVisitClicked
      },
      isBlocked
        ? {
            text: messages.unblock,
            icon: <IconUnblockMessages />,
            onClick: handleUnblockClicked
          }
        : {
            text: messages.block,
            icon: <IconBlockMessages />,
            onClick: handleBlockClicked
          },
      {
        text: messages.report,
        icon: <IconError />,
        onClick: handleReportClicked
      }
    ]

    return (
      <>
        <HeaderGutter
          headerContainerRef={headerContainerRef}
          isChromeOrSafari={isChromeOrSafari}
          scrollBarWidth={scrollBarWidth}
          className={styles.gutterOverride}
        />
        <div ref={ref} className={styles.root}>
          <div className={styles.left}>
            <h1 className={styles.header}>{messages.header}</h1>
            <div className={styles.options}>
              <IconButton
                aria-label={messages.settings}
                icon={<IconSettings className={styles.icon} />}
                onClick={handleSettingsClicked}
              />
              <IconButton
                aria-label={messages.compose}
                icon={<IconCompose className={styles.icon} />}
                onClick={handleComposeClicked}
              />
            </div>
          </div>
          <div className={styles.right}>
            {user ? <ChatUser user={user} key={user.user_id} /> : null}
            {user ? (
              <div className={styles.overflow}>
                <PopupMenu
                  items={overflowItems}
                  transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  renderTrigger={(ref, trigger) => (
                    <IconButton
                      ref={ref}
                      aria-label={messages.chatSettings}
                      icon={<IconKebabHorizontal />}
                      onClick={() => trigger()}
                    />
                  )}
                />
                <UnblockUserConfirmationModal
                  user={user}
                  isVisible={isUnblockUserModalVisible}
                  onClose={() => setIsUnblockUserModalVisible(false)}
                />
                <BlockUserConfirmationModal
                  user={user}
                  isVisible={isBlockUserModalVisible}
                  onClose={handleCloseBlockModal}
                  isReportAbuse={isReportAbuse}
                />
                <DeleteChatConfirmationModal
                  chatId={currentChatId}
                  isVisible={isDeleteChatModalVisible}
                  onClose={() => setIsDeleteChatModalVisible(false)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </>
    )
  }
)
