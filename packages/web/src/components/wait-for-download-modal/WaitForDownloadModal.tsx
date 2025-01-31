import { useCallback, useEffect } from 'react'

import { DownloadQuality } from '@audius/common/models'
import {
  CommonState,
  useWaitForDownloadModal,
  cacheTracksSelectors,
  tracksSocialActions,
  downloadsSelectors,
  cacheUsersSelectors
} from '@audius/common/store'
import { getFilename } from '@audius/common/utils'
import {
  ModalHeader,
  Flex,
  IconReceive,
  Text,
  Hint,
  IconError,
  TextLink,
  ModalTitle
} from '@audius/harmony'
import cn from 'classnames'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import ModalDrawer from 'components/modal-drawer/ModalDrawer'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './WaitForDownloadModal.module.css'

const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors
const { getDownloadError } = downloadsSelectors

const messages = {
  title: 'Downloading...',
  somethingWrong:
    'Something went wrong. Please check your connection and storage and try again.',
  tryAgain: 'Try again.'
}

export const WaitForDownloadModal = () => {
  const isMobile = useIsMobile()
  const {
    isOpen,
    onClose,
    onClosed,
    data: { parentTrackId, trackIds, quality }
  } = useWaitForDownloadModal()
  const dispatch = useDispatch()
  const track = useSelector(
    (state: CommonState) =>
      getTrack(state, { id: parentTrackId ?? trackIds[0] }),
    shallowEqual
  )
  const user = useSelector(
    (state: CommonState) => getUser(state, { id: track?.owner_id }),
    shallowEqual
  )

  const downloadError = useSelector(getDownloadError)

  const handleClosed = useCallback(() => {
    dispatch(tracksSocialActions.cancelDownloads())
    onClosed()
  }, [onClosed, dispatch])

  const performDownload = useCallback(() => {
    dispatch(
      tracksSocialActions.downloadTrack({
        trackIds,
        parentTrackId,
        original: quality === DownloadQuality.ORIGINAL
      })
    )
  }, [trackIds, parentTrackId, quality, dispatch])

  useEffect(() => {
    performDownload()
  }, [performDownload])

  const trackName =
    !parentTrackId &&
    user &&
    track?.orig_filename &&
    track?.orig_filename?.length > 0
      ? getFilename({
          track,
          user,
          isOriginal: quality === DownloadQuality.ORIGINAL
        })
      : track?.title

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={onClose}
      onClosed={handleClosed}
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
        <ModalTitle icon={<IconReceive />} title={messages.title} />
      </ModalHeader>
      <Flex direction='column' p='xl' gap='xl' alignItems='center'>
        <Text variant='body' size='l' strength='strong'>
          {trackName}
        </Text>
        {downloadError ? (
          <Hint icon={IconError}>
            <Flex direction='column' gap='m'>
              <Text variant='body' color='default'>
                {messages.somethingWrong}
              </Text>
              <TextLink variant='visible' onClick={performDownload}>
                {messages.tryAgain}
              </TextLink>
            </Flex>
          </Hint>
        ) : (
          <LoadingSpinner className={styles.spinner} />
        )}
      </Flex>
    </ModalDrawer>
  )
}
