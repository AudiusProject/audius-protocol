import {
  CommonState,
  useWaitForDownloadModal,
  cacheTracksSelectors
} from '@audius/common/store'
import { Flex, IconReceive, Text } from '@audius/harmony'
import { ModalHeader } from '@audius/stems'
import cn from 'classnames'
import { shallowEqual, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useIsMobile } from 'hooks/useIsMobile'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'

import styles from './WaitForDownloadModal.module.css'

const { getTrack } = cacheTracksSelectors

const messages = {
  title: 'Downloading...'
}

export const WaitForDownloadModal = () => {
  const isMobile = useIsMobile()
  const {
    isOpen,
    onClose,
    onClosed,
    data: { contentId }
  } = useWaitForDownloadModal()
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: contentId }),
    shallowEqual
  )

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      bodyClassName={styles.modal}
      isFullscreen
      useGradientTitle={false}
      dismissOnClickOutside
      wrapperClassName={isMobile ? styles.mobileWrapper : undefined}
    >
      <ModalHeader
        onClose={onClose}
        showDismissButton={!isMobile}
        className={cn(styles.modalHeader, { [styles.mobile]: isMobile })}
      >
        <Flex justifyContent='center' gap='s'>
          <Icon size='large' icon={IconReceive} />
          <Text variant='label' size='xl' strength='strong'>
            {messages.title}
          </Text>
        </Flex>
      </ModalHeader>
      <Flex direction='column' p='xl' gap='xl' alignItems='center'>
        <Text variant='body' size='l' strength='strong'>
          {track?.orig_filename}
        </Text>
        <LoadingSpinner className={styles.spinner} />
      </Flex>
    </ModalDrawer>
  )
}
