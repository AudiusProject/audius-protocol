import { ChangeEvent, useCallback, useEffect, useRef } from 'react'

import {
  useGetCurrentUserId,
  useGetMutedUsers,
  useGetSalesAggegrate
} from '@audius/common/api'
import { useMuteUser } from '@audius/common/context'
import { useSetInboxPermissions } from '@audius/common/hooks'
import { Status, User } from '@audius/common/models'
import { getUserId } from '@audius/common/src/store/account/selectors'
import {
  Flex,
  Text,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconMessage,
  RadioGroup,
  Button,
  IconMessageBlock,
  Scrollbar,
  Divider
} from '@audius/harmony'
import { ChatPermission } from '@audius/sdk'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { useModalState } from 'common/hooks/useModalState'
import ArtistChip from 'components/artist/ArtistChip'
import { MountPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { audiusSdk } from 'services/audius-sdk'

import { ModalRadioItem } from '../modal-radio/ModalRadioItem'

import styles from './CommentSettingsModal.module.css'

const messages = {
  title: 'Comment Settings',
  save: 'Save Changes',
  error: 'Something went wrong. Please try again.',
  description: 'Prevent certain users from commenting on your tracks.',
  followeeTitle: 'Only Allow Messages From People You Follow',
  followeeDescription:
    'Only users that you follow can initiate direct messages with you. You can still send messages to anyone.',
  tipperTitle: 'Only Allow Messages From Your Supporters',
  tipperDescription:
    'Only users who have tipped you can initiate direct messages with you. You can still send messages to anyone.',
  noneTitle: 'No One Can Message You',
  noneDescription:
    'Disable incoming direct messages entirely. You will no longer receive direct messages, but can still send messages to others.',
  unmute: 'Unmute',
  mute: 'Mute'
}

const options = [
  {
    title: messages.allTitle,
    description: messages.allDescription,
    value: ChatPermission.ALL
  },
  {
    title: messages.followeeTitle,
    description: messages.followeeDescription,
    value: ChatPermission.FOLLOWEES
  },
  {
    title: messages.tipperTitle,
    description: messages.tipperDescription,
    value: ChatPermission.TIPPERS
  },
  {
    title: messages.noneTitle,
    description: messages.noneDescription,
    value: ChatPermission.NONE
  }
]

export const CommentSettingsModal = () => {
  const [isVisible, setIsVisible] = useModalState('CommentSettings')
  const handleClose = useCallback(() => setIsVisible(false), [setIsVisible])
  const scrollParentRef = useRef<HTMLElement>()
  const { data: currentUserId } = useGetCurrentUserId({})

  console.log('asdf currentUserId', currentUserId)
  const { data: mutedUsers } = useGetMutedUsers({
    userId: currentUserId!
  })
  if (!mutedUsers) return
  console.log('asdf mutedUsers', mutedUsers)

  return (
    <Modal
      bodyClassName={styles.modalBody}
      onClose={handleClose}
      isOpen={isVisible}
    >
      <ModalHeader onClose={handleClose}>
        <ModalTitle title={messages.title} icon={<IconMessageBlock />} />
      </ModalHeader>
      <ModalContent className={styles.modalContent}>
        <Flex p='xl'>
          <Text>{messages.description}</Text>
        </Flex>
        <Scrollbar
          className={styles.scrollable}
          containerRef={(containerRef) => {
            scrollParentRef.current = containerRef
          }}
        >
          {mutedUsers.map((user) => {
            return (
              <>
                <Flex
                  key={user.user_id}
                  alignItems='center'
                  direction='row'
                  p='l'
                >
                  <MutedUser user={user} />
                </Flex>
                <Divider orientation='horizontal'></Divider>
              </>
            )
          })}
        </Scrollbar>
      </ModalContent>
    </Modal>
  )
}

export const MutedUser = (props: { user: any }) => {
  const { user } = props
  const onClickArtistName = (handle: string) => {}
  const onNavigateAway = () => {}
  const isMobile = useIsMobile()
  const [muteUser] = useMuteUser()

  const [isMuted, toggleMuted] = useToggle(true)

  return (
    <>
      <ArtistChip
        user={user}
        onClickArtistName={() => {
          onClickArtistName(user.handle)
        }}
        onNavigateAway={onNavigateAway}
        showPopover={!isMobile}
        popoverMount={MountPlacement.BODY}
      />
      <Button
        size='small'
        variant={isMuted ? 'primary' : 'secondary'}
        onClick={() => {
          muteUser({ mutedUserId: user.user_id, isMuted })
          toggleMuted()
        }}
      >
        {isMuted ? messages.unmute : messages.mute}
      </Button>
    </>
  )
}

export default CommentSettingsModal
