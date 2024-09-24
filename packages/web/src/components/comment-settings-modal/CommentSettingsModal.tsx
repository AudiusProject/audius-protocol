import { useCallback, useRef } from 'react'

import { useGetCurrentUserId, useGetMutedUsers } from '@audius/common/api'
import { useMuteUser } from '@audius/common/context'
import {
  Flex,
  Text,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Button,
  IconMessageBlock,
  Scrollbar,
  Divider
} from '@audius/harmony'
import { useToggle } from 'react-use'

import { useModalState } from 'common/hooks/useModalState'
import ArtistChip from 'components/artist/ArtistChip'
import { MountPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './CommentSettingsModal.module.css'

const messages = {
  title: 'Comment Settings',
  save: 'Save Changes',
  error: 'Something went wrong. Please try again.',
  description: 'Prevent certain users from commenting on your tracks.',
  unmute: 'Unmute',
  mute: 'Mute',
  noMutedUsers:
    'You haven’t muted any users. Once you do, they will appear here.'
}

export const CommentSettingsModal = () => {
  const [isVisible, setIsVisible] = useModalState('CommentSettings')
  const handleClose = useCallback(() => setIsVisible(false), [setIsVisible])
  const scrollParentRef = useRef<HTMLElement>()
  const { data: currentUserId } = useGetCurrentUserId({})

  const { data: mutedUsers } = useGetMutedUsers({
    userId: currentUserId!
  })

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
        <Flex ph='xl' pt='xl' mb='l'>
          <Text>{messages.description}</Text>
        </Flex>
        {mutedUsers.length === 0 ? (
          <Flex ph='xl' pb='xl'>
            <Text color='subdued'>{messages.noMutedUsers}</Text>
          </Flex>
        ) : null}

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
