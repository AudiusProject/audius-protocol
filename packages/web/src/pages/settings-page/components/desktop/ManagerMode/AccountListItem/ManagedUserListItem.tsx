import { useCallback, useContext, useEffect, useMemo } from 'react'

import { useAppContext } from '@audius/common/context'
import { useAccountSwitcher, useIsManagedAccount } from '@audius/common/hooks'
import { ManagedUserMetadata, Name, Status } from '@audius/common/models'
import {
  useApproveManagedAccount,
  useRemoveManager
} from '@audius/common/src/api/account'
import { accountSelectors, chatSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconButton,
  IconCheck,
  IconCloseAlt,
  IconKebabHorizontal,
  IconMessage,
  IconTrash,
  IconUser,
  IconUserArrowRotate,
  PopupMenu,
  Text
} from '@audius/harmony'

import { ToastContext } from 'components/toast/ToastContext'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useComposeChat } from 'pages/chat-page/components/useComposeChat'
import { useSelector } from 'utils/reducer'
import zIndex from 'utils/zIndex'

import { sharedMessages } from '../sharedMessages'

import { ArtistInfo } from './ArtistInfo'

const { profilePage } = route
const { getUserId } = accountSelectors
const { getCanCreateChat } = chatSelectors

const messages = {
  moreOptions: 'more options',
  stopManaging: 'Stop Managing',
  visitProfile: 'Visit Profile',
  sendMessage: 'Send Message',
  invitePending: 'Invite Pending',
  switchToUser: 'Switch to User',
  invitationAccepted: 'Invitation Accepted!',
  invitationRejected: 'Invitation Refused'
}

type ManagedUserListItemProps = {
  userData: ManagedUserMetadata
  onRemoveManager: (params: { userId: number; managerUserId: number }) => void
}

export const ManagedUserListItem = ({
  userData: { user, grant },
  onRemoveManager
}: ManagedUserListItemProps) => {
  const currentUserId = useSelector(getUserId)
  const isManagerMode = useIsManagedAccount()

  const navigate = useNavigateToPage()
  const goToProfile = useCallback(() => {
    navigate(profilePage(user.handle))
  }, [navigate, user])

  const { switchAccount } = useAccountSwitcher()

  const { canCreateChat } = useSelector((state) =>
    getCanCreateChat(state, { userId: user?.user_id })
  )

  const composeChat = useComposeChat({
    user
  })

  const handleRemoveManager = useCallback(() => {
    if (!currentUserId) return
    onRemoveManager({
      userId: user.user_id,
      managerUserId: currentUserId
    })
  }, [currentUserId, user.user_id, onRemoveManager])

  const [approveManagedAccount, { status: approveStatus }] =
    useApproveManagedAccount()
  const [rejectManagedAccount, { status: rejectStatus }] = useRemoveManager()
  const isPending =
    grant?.is_approved == null ||
    approveStatus === Status.LOADING ||
    rejectStatus === Status.LOADING
  const { toast } = useContext(ToastContext)
  const {
    analytics: { track, make }
  } = useAppContext()

  const handleApprove = useCallback(() => {
    if (!currentUserId) return

    track(
      make({
        eventName: Name.MANAGER_MODE_ACCEPT_INVITE,
        managedUserId: user.user_id
      })
    )
    approveManagedAccount({
      userId: currentUserId,
      grantorUser: user
    })
  }, [approveManagedAccount, currentUserId, user, make, track])

  const handleReject = useCallback(() => {
    if (!currentUserId) return
    track(
      make({
        eventName: Name.MANAGER_MODE_REJECT_INVITE,
        managedUserId: user.user_id
      })
    )
    rejectManagedAccount({
      userId: user.user_id,
      managerUserId: currentUserId
    })
    toast(messages.invitationRejected)
  }, [rejectManagedAccount, currentUserId, user.user_id, toast, make, track])

  useEffect(() => {
    if (approveStatus === Status.SUCCESS) {
      toast(messages.invitationAccepted)
    } else if (approveStatus === Status.ERROR) {
      toast(sharedMessages.somethingWentWrong)
    }
  }, [toast, approveStatus])

  useEffect(() => {
    if (rejectStatus === Status.ERROR) {
      toast(sharedMessages.somethingWentWrong)
    }
  }, [toast, rejectStatus])

  const popupMenuItems = useMemo(() => {
    const items = []
    if (!isPending) {
      items.push({
        icon: <IconTrash />,
        text: messages.stopManaging,
        onClick: handleRemoveManager
      })
    }
    items.push({
      icon: <IconUser />,
      text: messages.visitProfile,
      onClick: goToProfile
    })

    // Don't show DM/switch options if we're in manager mode as the
    // logged in user won't have permission to do those things on behalf of a
    // managed account.
    if (canCreateChat && !isManagerMode) {
      items.push({
        icon: <IconMessage />,
        text: messages.sendMessage,
        onClick: composeChat
      })
    }

    if (!isManagerMode) {
      items.push({
        icon: <IconUserArrowRotate />,
        text: messages.switchToUser,
        onClick: () => switchAccount(user)
      })
    }

    return items
  }, [
    user,
    switchAccount,
    isManagerMode,
    isPending,
    handleRemoveManager,
    goToProfile,
    composeChat,
    canCreateChat
  ])

  const renderTrigger = (
    anchorRef: React.MutableRefObject<any>,
    triggerPopup: () => void
  ) => (
    <IconButton
      ref={anchorRef}
      aria-label={messages.moreOptions}
      icon={IconKebabHorizontal}
      color='subdued'
      onClick={() => triggerPopup()}
    />
  )

  if (!user || !currentUserId) return null

  return (
    <Flex
      alignItems='stretch'
      justifyContent='space-between'
      pl='xl'
      pr='l'
      pv='l'
      gap='l'
      border='default'
    >
      <ArtistInfo user={user} />
      <Flex direction='column' justifyContent='space-between' alignItems='end'>
        {!isPending ? (
          <PopupMenu
            renderTrigger={renderTrigger}
            items={popupMenuItems}
            zIndex={zIndex.MODAL_OVERFLOW_MENU_POPUP}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          />
        ) : null}
      </Flex>
      {isPending ? (
        <Flex direction='column' gap='s'>
          <Text variant='label' size='s' color='subdued'>
            {messages.invitePending}
          </Text>
          <Flex gap='s' alignSelf='end'>
            <Button
              disabled={rejectStatus === Status.LOADING}
              isLoading={approveStatus === Status.LOADING}
              size='small'
              variant='secondary'
              aria-label='approve'
              iconLeft={IconCheck}
              onClick={handleApprove}
            />
            <Button
              disabled={approveStatus === Status.LOADING}
              isLoading={rejectStatus === Status.LOADING}
              size='small'
              variant='destructive'
              aria-label='reject'
              iconRight={IconCloseAlt}
              onClick={handleReject}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}
