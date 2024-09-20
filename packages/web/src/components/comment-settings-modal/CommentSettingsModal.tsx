import { ChangeEvent, useCallback, useEffect, useRef } from 'react'

import {
  useGetCurrentUserId,
  useGetMutedUsers,
  useGetSalesAggegrate
} from '@audius/common/api'
import { useSetInboxPermissions } from '@audius/common/hooks'
import { Status, User } from '@audius/common/models'
import { getUserId } from '@audius/common/src/store/account/selectors'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconMessage,
  RadioGroup,
  Button,
  IconMessageBlock,
  Scrollbar
} from '@audius/harmony'
import { ChatPermission } from '@audius/sdk'
import { useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import ArtistChip from 'components/artist/ArtistChip'
import { MountPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { audiusSdk } from 'services/audius-sdk'

import styles from '../inbox-settings-modal/InboxSettingsModal.module.css'
import { ModalRadioItem } from '../modal-radio/ModalRadioItem'

const messages = {
  title: 'Comment Settings',
  save: 'Save Changes',
  error: 'Something went wrong. Please try again.',
  allTitle: 'Allow Messages from Everyone',
  allDescription:
    'Anyone can send you a direct message, regardless of whether you follow them or not.',
  followeeTitle: 'Only Allow Messages From People You Follow',
  followeeDescription:
    'Only users that you follow can initiate direct messages with you. You can still send messages to anyone.',
  tipperTitle: 'Only Allow Messages From Your Supporters',
  tipperDescription:
    'Only users who have tipped you can initiate direct messages with you. You can still send messages to anyone.',
  noneTitle: 'No One Can Message You',
  noneDescription:
    'Disable incoming direct messages entirely. You will no longer receive direct messages, but can still send messages to others.'
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
        {' '}
        <Scrollbar
          className={styles.scrollable}
          containerRef={(containerRef) => {
            scrollParentRef.current = containerRef
          }}
        >
          <MutedUserList users={mutedUsers} />
        </Scrollbar>
      </ModalContent>
      <ModalFooter>
        <Button
          variant='primary'
          isLoading={false}
          fullWidth
          onClick={() => {}}
        >
          {messages.save}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export const MutedUserList = (props: { users: any }) => {
  const { users } = props
  const onClickArtistName = (handle: string) => {}
  const onNavigateAway = () => {}
  const isMobile = useIsMobile()
  if (!users) return <></>

  return (
    <>
      {users.map((user) => {
        // return (
        //   <div key={user.id}>
        //     <p>{user.name}</p>
        //   </div>
        // )
        console.log('asdf user: ', user)
        return (
          <div key={user.user_id}>
            <ArtistChip
              user={user}
              onClickArtistName={() => {
                onClickArtistName(user.handle)
              }}
              onNavigateAway={onNavigateAway}
              showPopover={!isMobile}
              popoverMount={MountPlacement.BODY}
            />
          </div>
        )
      })}
    </>
  )
}
export default CommentSettingsModal
