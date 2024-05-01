import { useCallback, useState } from 'react'

import { accountSelectors, chatSelectors } from '@audius/common/store'
import { encodeHashId } from '@audius/common/utils'
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

import { User, UserMetadata } from '@audius/common/models'
import ArtistChip from 'components/artist/ArtistChip'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { useComposeChat } from 'pages/chat-page/components/useComposeChat'
import { audiusSdk } from 'services/audius-sdk'
import { useSelector } from 'utils/reducer'
import { profilePage } from 'utils/route'
import zIndex from 'utils/zIndex'

const { getUserId } = accountSelectors
const { getCanCreateChat } = chatSelectors

const messages = {
  moreOptions: 'more options',
  removeManager: 'Remove Manager',
  stopManaging: 'Stop Managing',
  visitProfile: 'Visit Profile',
  sendMessage: 'Send Message',
  invitePending: 'Invite Pending',
  cancelInvite: 'Cancel Invite',
  switchToUser: 'Switch to User'
}

type AccountListItemProps = {
  isPending: boolean
  user: User | UserMetadata
  isManagedAccount?: boolean
  onApprove?: (params: {
    currentUserId: number
    grantorUser: User | UserMetadata
  }) => void
  onReject?: (params: {
    currentUserId: number
    grantorUser: User | UserMetadata
  }) => void
}

export const AccountListItem = ({
  isPending,
  user,
  isManagedAccount,
  onApprove,
  onReject
}: AccountListItemProps) => {
  const currentUserId = useSelector(getUserId)

  const goToRoute = useGoToRoute()
  const goToProfile = useCallback(() => {
    if (!user) return
    goToRoute(profilePage(user.handle))
  }, [goToRoute, user])

  const { canCreateChat } = useSelector((state) =>
    getCanCreateChat(state, { userId: user?.user_id })
  )

  const composeChat = useComposeChat({
    // @ts-expect-error - This wants a User, but works with UserMetadata
    user
  })

  const removeManager = useCallback(async () => {
    const sdk = await audiusSdk()
    if (!currentUserId) {
      return
    }
    try {
      // TODO(nkang - PAY-2827) - Turn into audius-query mutation
      await sdk.grants.removeManager({
        userId: encodeHashId(currentUserId),
        managerUserId: encodeHashId(user!.user_id)
      })
      // eslint-disable-next-line no-console
      console.log('Successfully removed manager')
    } catch (e) {
      console.error(e)
    }
  }, [currentUserId, user])

  const popupMenuItems = [
    {
      icon: <IconTrash />,
      text: isManagedAccount
        ? messages.stopManaging
        : isPending
        ? messages.cancelInvite
        : messages.removeManager,
      onClick: removeManager
    },
    {
      icon: <IconUser />,
      text: messages.visitProfile,
      onClick: goToProfile
    },
    ...(canCreateChat
      ? [
          {
            icon: <IconMessage />,
            text: messages.sendMessage,
            onClick: composeChat
          }
        ]
      : []),
    ...(isManagedAccount
      ? [
          {
            icon: <IconUserArrowRotate />,
            text: messages.switchToUser,
            // TODO(nkang - PAY-2831) - Implement this
            onClick: () => {}
          }
        ]
      : [])
  ]

  const handleApprove = useCallback(() => {
    if (!currentUserId) return
    onApprove?.({ currentUserId, grantorUser: user })
  }, [onApprove, currentUserId])

  const handleReject = useCallback(() => {
    if (!currentUserId) return
    onReject?.({ currentUserId, grantorUser: user })
  }, [onReject, currentUserId])

  const renderTrigger = (
    anchorRef: React.MutableRefObject<any>,
    triggerPopup: () => void
  ) => (
    <IconButton
      ref={anchorRef}
      aria-label={messages.moreOptions}
      icon={IconKebabHorizontal}
      color='default'
      onClick={triggerPopup}
    />
  )

  if (!user || !currentUserId) return null

  return (
    <Flex
      alignItems='stretch'
      justifyContent='space-between'
      ph='xl'
      pv='l'
      border='default'
    >
      <ArtistChip user={user as any} showPopover={false} />
      <Flex direction='column' justifyContent='space-between' alignItems='end'>
        {!isPending || !isManagedAccount ? (
          <PopupMenu
            renderTrigger={renderTrigger}
            items={popupMenuItems}
            zIndex={zIndex.MODAL_OVERFLOW_MENU_POPUP}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          />
        ) : null}
        {isPending && !isManagedAccount ? (
          <Text variant='label' size='s' color='subdued'>
            {messages.invitePending}
          </Text>
        ) : null}
      </Flex>
      {isManagedAccount && isPending ? (
        <Flex direction='column' gap='s'>
          <Text variant='label' size='s' color='subdued'>
            {messages.invitePending}
          </Text>
          <Flex gap='s' alignSelf='end'>
            <Button
              size='small'
              variant='secondary'
              aria-label='approve'
              iconLeft={IconCheck}
              onClick={handleApprove}
            />
            <Button
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
