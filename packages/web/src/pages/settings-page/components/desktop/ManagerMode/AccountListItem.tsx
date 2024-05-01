import { useCallback, useEffect } from 'react'

import {
  accountSelectors,
  cacheUsersActions,
  cacheUsersSelectors,
  chatSelectors
} from '@audius/common/store'
import { encodeHashId } from '@audius/common/utils'
import {
  Flex,
  IconButton,
  IconKebabHorizontal,
  IconMessage,
  IconTrash,
  IconUser,
  PopupMenu,
  Text
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import ArtistChip from 'components/artist/ArtistChip'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { useComposeChat } from 'pages/chat-page/components/useComposeChat'
import { audiusSdk } from 'services/audius-sdk'
import { useSelector } from 'utils/reducer'
import { profilePage } from 'utils/route'
import zIndex from 'utils/zIndex'

const { getUserId } = accountSelectors
const { getUser } = cacheUsersSelectors
const { fetchUsers } = cacheUsersActions
const { getCanCreateChat } = chatSelectors

const messages = {
  moreOptions: 'more options',
  removeManager: 'Remove Manager',
  visitProfile: 'Visit Profile',
  sendMessage: 'Send Message',
  invitePending: 'Invite Pending'
}

// (TODO (nkang - C-4315) - Hook up to real data)
export const AccountListItem = () => {
  const user = useSelector((state) => getUser(state, { id: 5 }))
  const currentUserId = useSelector(getUserId)

  const dispatch = useDispatch()

  useEffect(() => {
    if (!user) {
      dispatch(fetchUsers({ userIds: [5] }))
    }
  }, [dispatch, user])

  const goToRoute = useGoToRoute()
  const goToProfile = useCallback(() => {
    if (!user) return
    goToRoute(profilePage(user.handle))
  }, [goToRoute, user])

  const { canCreateChat } = useSelector((state) =>
    getCanCreateChat(state, { userId: user?.user_id })
  )

  const composeChat = useComposeChat({
    user: user!
  })

  // Note: UI has not been designed, so this is the bare bones callback for now (see ).
  const removeManager = useCallback(async () => {
    const sdk = await audiusSdk()
    if (!currentUserId) {
      return
    }
    try {
      // TODO(nkang - C-4315) - Turn into audius-query mutation
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
      text: messages.removeManager,
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
      : [])
  ]

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

  if (!user) return null
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
        <PopupMenu
          renderTrigger={renderTrigger}
          items={popupMenuItems}
          zIndex={zIndex.MODAL_OVERFLOW_MENU_POPUP}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        />
        <Text variant='label' size='s' color='subdued'>
          {messages.invitePending}
        </Text>
      </Flex>
    </Flex>
  )
}
