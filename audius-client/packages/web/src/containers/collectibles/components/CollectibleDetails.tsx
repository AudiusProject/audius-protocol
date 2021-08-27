import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Modal, IconLink, LogoEth, LogoSol } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { ReactComponent as IconMute } from 'assets/img/iconVolume0.svg'
import { ReactComponent as IconPlay } from 'assets/img/pbIconPlay.svg'
import Drawer from 'components/drawer/Drawer'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import PerspectiveCard from 'components/perspective-card/PerspectiveCard'
import PreloadImage from 'components/preload-image/PreloadImage'
import Tooltip from 'components/tooltip/Tooltip'
import { MountPlacement } from 'components/types'
import { collectibleMessages } from 'containers/collectibles/components/CollectiblesPage'
import styles from 'containers/collectibles/components/CollectiblesPage.module.css'
import {
  Collectible,
  CollectibleMediaType
} from 'containers/collectibles/types'
import { Chain } from 'store/token-dashboard/slice'
import { formatDateWithTimezoneOffset } from 'utils/timeUtil'

const CollectibleMedia: React.FC<{
  collectible: Collectible
  isMuted: boolean
  toggleMute: () => void
}> = ({ collectible, isMuted, toggleMute }) => {
  const { mediaType, imageUrl, videoUrl, gifUrl } = collectible

  return mediaType === CollectibleMediaType.GIF ? (
    <div className={styles.detailsMediaWrapper}>
      <img src={gifUrl!} alt='Collectible' />
    </div>
  ) : mediaType === CollectibleMediaType.VIDEO ? (
    <div className={styles.detailsMediaWrapper} onClick={toggleMute}>
      <video muted={isMuted} autoPlay loop playsInline src={videoUrl!}>
        {collectibleMessages.videoNotSupported}
      </video>
      {isMuted ? (
        <IconMute className={styles.volumeIcon} />
      ) : (
        <IconVolume className={styles.volumeIcon} />
      )}
    </div>
  ) : (
    <div className={styles.detailsMediaWrapper}>
      <img src={imageUrl!} alt='Collectible' />
    </div>
  )
}

const CollectibleDetails: React.FC<{
  collectible: Collectible
  isMobile: boolean
}> = ({ collectible, isMobile }) => {
  const { mediaType, frameUrl, videoUrl } = collectible

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(true)

  const handleItemClick = useCallback(() => {
    if (isMobile) {
      setIsDrawerOpen(true)
    } else {
      setIsModalOpen(true)
    }
  }, [isMobile, setIsDrawerOpen, setIsModalOpen])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted, setIsMuted])

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef?.current) {
      const videoElement = videoRef.current
      const listener = () => {
        videoElement.pause()
      }
      ;['loadeddata', 'timeupdate'].forEach(event => {
        videoElement.addEventListener(event, listener)
      })

      return () => {
        ;['loadeddata', 'timeupdate'].forEach(event => {
          videoElement.removeEventListener(event, listener)
        })
      }
    }
  }, [videoRef])

  return (
    <div className={styles.detailsContainer}>
      <PerspectiveCard
        className={styles.perspectiveCard}
        onClick={handleItemClick}
      >
        {mediaType === CollectibleMediaType.GIF ||
        (mediaType === CollectibleMediaType.VIDEO && frameUrl) ? (
          <div className={styles.imageWrapper}>
            <PreloadImage
              asBackground
              src={frameUrl!}
              className={styles.media}
            />
            <IconPlay className={styles.playIcon} />
            <div className={styles.stamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}
            </div>
          </div>
        ) : mediaType === CollectibleMediaType.VIDEO ? (
          <div className={cn(styles.media, styles.imageWrapper)}>
            <IconPlay className={styles.playIcon} />
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              style={{ height: '100%', width: '100%' }}
              src={videoUrl!}
            />
            <div className={styles.stamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}
            </div>
          </div>
        ) : mediaType === CollectibleMediaType.IMAGE ? (
          <div className={styles.imageWrapper}>
            <PreloadImage
              asBackground
              src={frameUrl!}
              className={styles.media}
            />
            <div className={styles.stamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.media}>
            <LoadingSpinner className={styles.loadingSpinner} />
          </div>
        )}
        <div className={styles.nftTitle}>{collectible.name}</div>
      </PerspectiveCard>

      <Modal
        title='Collectible'
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        showTitleHeader
        showDismissButton
        bodyClassName={styles.modalBody}
        headerContainerClassName={styles.modalHeader}
        titleClassName={styles.modalTitle}
        allowScroll
      >
        <div className={styles.nftModal}>
          <CollectibleMedia
            collectible={collectible}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />

          <div className={styles.details}>
            <div className={styles.detailsTitle}>{collectible.name}</div>
            <div className={styles.detailsStamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}

              {collectible.chain === Chain.Eth ? (
                <Tooltip text='Ethereum' mount={MountPlacement.PARENT}>
                  <LogoEth className={styles.chainIcon} />
                </Tooltip>
              ) : (
                <Tooltip text='Solana' mount={MountPlacement.PARENT}>
                  <LogoSol className={styles.chainIcon} />
                </Tooltip>
              )}
            </div>

            {collectible.dateCreated && (
              <div>
                <div>Date Created:</div>
                <div className={styles.date}>
                  {formatDateWithTimezoneOffset(collectible.dateCreated)}
                </div>
              </div>
            )}

            {collectible.dateLastTransferred && (
              <div>
                <div>Last Transferred:</div>
                <div className={styles.date}>
                  {formatDateWithTimezoneOffset(
                    collectible.dateLastTransferred
                  )}
                </div>
              </div>
            )}

            <div className={styles.detailsDescription}>
              {collectible.description}
            </div>

            {collectible.externalLink && (
              <a
                className={styles.link}
                href={collectible.externalLink}
                target='_blank'
                rel='noopener noreferrer'
              >
                <IconLink className={styles.linkIcon} />
                {new URL(collectible.externalLink).hostname}
              </a>
            )}

            {collectible.permaLink && (
              <a
                className={styles.link}
                href={collectible.permaLink}
                target='_blank'
                rel='noopener noreferrer'
              >
                <IconLink className={styles.linkIcon} />
                {collectibleMessages.linkToCollectible}
              </a>
            )}
          </div>
        </div>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isFullscreen
      >
        <div className={styles.nftDrawer}>
          <CollectibleMedia
            collectible={collectible}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />

          <div className={styles.details}>
            <div className={styles.detailsTitle}>{collectible.name}</div>
            <div className={styles.detailsStamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}

              {collectible.chain === Chain.Eth ? (
                <LogoEth className={styles.chainIcon} />
              ) : (
                <LogoSol className={styles.chainIcon} />
              )}
            </div>

            {collectible.dateCreated && (
              <div className={styles.dateWrapper}>
                <div>Date Created:</div>
                <div className={styles.date}>
                  {formatDateWithTimezoneOffset(collectible.dateCreated)}
                </div>
              </div>
            )}

            {collectible.dateLastTransferred && (
              <div className={styles.dateWrapper}>
                <div>Last Transferred:</div>
                <div className={styles.date}>
                  {formatDateWithTimezoneOffset(
                    collectible.dateLastTransferred
                  )}
                </div>
              </div>
            )}

            <div className={styles.detailsDescription}>
              {collectible.description}
            </div>

            {collectible.externalLink && (
              <a
                className={styles.link}
                href={collectible.externalLink}
                target='_blank'
                rel='noopener noreferrer'
              >
                <IconLink className={styles.linkIcon} />
                {new URL(collectible.externalLink).hostname}
              </a>
            )}
            {collectible.permaLink && (
              <a
                className={styles.link}
                href={collectible.permaLink}
                target='_blank'
                rel='noopener noreferrer'
              >
                <IconLink className={styles.linkIcon} />
                {collectibleMessages.linkToCollectible}
              </a>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default CollectibleDetails
