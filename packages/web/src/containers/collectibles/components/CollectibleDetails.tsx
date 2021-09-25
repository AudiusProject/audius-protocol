import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  Button,
  ButtonSize,
  ButtonType,
  IconImage,
  IconLink,
  LogoEth,
  LogoSol,
  Modal
} from '@audius/stems'
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
import { useFlag } from 'containers/remote-config/hooks'
import { useScript } from 'hooks/useScript'
import { FeatureFlags } from 'services/remote-config'
import { Chain } from 'store/token-dashboard/slice'
import { preload } from 'utils/image'
import { getScrollParent } from 'utils/scrollParent'
import { formatDateWithTimezoneOffset } from 'utils/timeUtil'

import { getFrameFromGif } from '../ethCollectibleHelpers'

const MODEL_VIEWER_SCRIPT_URL =
  'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'

const CollectibleMedia: React.FC<{
  collectible: Collectible
  isMuted: boolean
  toggleMute: () => void
  isMobile: boolean
}> = ({ collectible, isMuted, toggleMute, isMobile }) => {
  // if it becomes possible to render more than 1 collectible detail (model or mobile drawer), then
  // update useScript hook to handle multiple in-flight requests
  const scriptLoaded = useScript(MODEL_VIEWER_SCRIPT_URL, true)

  const { mediaType, imageUrl, videoUrl, gifUrl, threeDUrl } = collectible

  const [isSvg, setIsSvg] = useState(false)

  // check for svg images to give them non-empty width
  const handleImage = useCallback(
    (imageContainer: HTMLDivElement | null) => {
      if (
        mediaType === CollectibleMediaType.IMAGE &&
        imageUrl?.endsWith('.svg') &&
        imageContainer &&
        getComputedStyle(imageContainer).width === '0px'
      ) {
        setIsSvg(true)
      }
    },
    [mediaType, imageUrl, setIsSvg]
  )

  const ref3D = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (threeDUrl && ref3D?.current && scriptLoaded) {
      ref3D.current.innerHTML = `<model-viewer src=${threeDUrl} auto-rotate camera-controls />`
      const modelViewer = ref3D.current.children[0] as HTMLElement
      modelViewer.style.minWidth = '50vw'
      modelViewer.style.minHeight = '50vh'

      if (isMobile) {
        modelViewer.style.width = '100%'

        // for 3d objects, disable parent nft drawer element scrollability if user is on 3d object
        const scrollableAncestor = getScrollParent(modelViewer)
        let foundDrawerAncestor = false
        for (const item of (scrollableAncestor?.classList ?? []).values()) {
          if (item.includes('nftDrawer')) {
            foundDrawerAncestor = true
            break
          }
        }
        if (foundDrawerAncestor) {
          const scrollableAncestorElement = scrollableAncestor as HTMLElement
          const mouseEnterListener = () => {
            scrollableAncestorElement.style.overflowY = 'hidden'
            console.log(scrollableAncestorElement.style.overflowY)
          }
          const mouseLeaveListener = () => {
            scrollableAncestorElement.style.overflowY = 'scroll'
            console.log(scrollableAncestorElement.style.overflowY)
          }
          modelViewer.addEventListener('mouseenter', mouseEnterListener)
          modelViewer.addEventListener('mouseleave', mouseLeaveListener)

          return () => {
            modelViewer.removeEventListener('mouseenter', mouseEnterListener)
            modelViewer.removeEventListener('mouseleave', mouseLeaveListener)
          }
        }
      }
    }
  }, [threeDUrl, ref3D, isMobile, scriptLoaded])

  return mediaType === CollectibleMediaType.THREE_D ? (
    <div className={styles.detailsMediaWrapper} ref={ref3D} />
  ) : mediaType === CollectibleMediaType.GIF ? (
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
    <div
      className={cn(styles.detailsMediaWrapper, { [styles.svg]: isSvg })}
      ref={handleImage}
    >
      <img src={imageUrl!} alt='Collectible' />
    </div>
  )
}

const CollectibleDetails: React.FC<{
  collectible: Collectible
  isMobile: boolean
  updateProfilePicture?: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => void
  onSave?: () => void
}> = ({ collectible, isMobile, updateProfilePicture, onSave }) => {
  const { mediaType, frameUrl, videoUrl, gifUrl, name } = collectible

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isPicConfirmModalOpen, setIsPicConfirmaModalOpen] = useState<boolean>(
    false
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(true)
  const [frame, setFrame] = useState(frameUrl)
  const [showSpinner, setShowSpinner] = useState(false)

  const { isEnabled: isCollectibleOptionEnabled } = useFlag(
    FeatureFlags.NFT_IMAGE_PICKER_TAB
  )

  // Debounce showing the spinner for a second
  useEffect(() => {
    setTimeout(() => {
      setShowSpinner(true)
    }, 1000)
  }, [])

  useEffect(() => {
    const load = async () => {
      let f = frameUrl
      if (
        !f &&
        [CollectibleMediaType.GIF, CollectibleMediaType.THREE_D].includes(
          mediaType
        )
      ) {
        f = await getFrameFromGif(gifUrl!, name || '')
      } else if (!f && mediaType === CollectibleMediaType.VIDEO) {
        setIsLoading(false)
      }
      // we know that images and 3D objects have frame urls so no need to check those

      if (f) {
        await preload(f)
        setFrame(f)
        setIsLoading(false)
      }
    }
    load()
  }, [mediaType, frameUrl, gifUrl, name, setFrame, setIsLoading])

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

  const handleVideo = useCallback(videoElement => {
    if (videoElement !== null) {
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
  }, [])

  const onClickProfPicUpload = async () => {
    const { imageUrl } = collectible
    if (!updateProfilePicture || !onSave || imageUrl === null) return

    const blob = await fetch(imageUrl).then(r => r.blob())
    await updateProfilePicture([blob], 'url')
    await onSave()
    setIsPicConfirmaModalOpen(false)
  }

  return (
    <div className={styles.detailsContainer}>
      <PerspectiveCard
        className={styles.perspectiveCard}
        onClick={handleItemClick}
      >
        <>
          {isLoading ? (
            <div className={styles.media}>
              {showSpinner && (
                <LoadingSpinner className={styles.loadingSpinner} />
              )}
            </div>
          ) : (
            <>
              {(mediaType === CollectibleMediaType.GIF ||
                (mediaType === CollectibleMediaType.VIDEO && frame)) && (
                <div className={styles.imageWrapper}>
                  <PreloadImage
                    asBackground
                    src={frame!}
                    preloaded={true}
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
              )}
              {mediaType === CollectibleMediaType.VIDEO && !frame && (
                <div className={cn(styles.media, styles.imageWrapper)}>
                  <IconPlay className={styles.playIcon} />
                  <video
                    ref={handleVideo}
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
              )}
              {(mediaType === CollectibleMediaType.IMAGE ||
                mediaType === CollectibleMediaType.THREE_D) && (
                <div className={styles.imageWrapper}>
                  <PreloadImage
                    asBackground
                    src={frame!}
                    preloaded={true}
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
              )}
            </>
          )}
        </>
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
            isMobile={isMobile}
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

            {isCollectibleOptionEnabled &&
              collectible.mediaType === CollectibleMediaType.IMAGE && (
                <Button
                  className={styles.profPicUploadButton}
                  textClassName={styles.profPicUploadButtonText}
                  iconClassName={styles.profPicUploadButtonIcon}
                  onClick={() => {
                    setIsModalOpen(false)
                    setIsPicConfirmaModalOpen(true)
                  }}
                  text='Set As Profile Pic'
                  type={ButtonType.COMMON_ALT}
                  size={ButtonSize.SMALL}
                  leftIcon={<IconImage />}
                />
              )}
          </div>
        </div>
      </Modal>

      <Modal
        showTitleHeader
        showDismissButton
        headerContainerClassName={styles.modalHeader}
        isOpen={isPicConfirmModalOpen}
        onClose={() => setIsPicConfirmaModalOpen(false)}
        titleClassName={styles.confirmModalTitle}
        title={
          <>
            <IconImage />
            <span>Set as Profile Pic</span>
          </>
        }
      >
        <div className={styles.confirmModalContainer}>
          <p className={styles.confirmModalText}>
            Are you sure you want to change your profile picture?
          </p>

          <div className={styles.confirmButtonContainer}>
            <Button
              className={styles.profPicConfirmButton}
              onClick={() => setIsPicConfirmaModalOpen(false)}
              text='Nevermind'
              type={ButtonType.COMMON_ALT}
            />
            <Button
              className={styles.profPicConfirmButton}
              onClick={onClickProfPicUpload}
              text='Yes'
              type={ButtonType.PRIMARY_ALT}
            />
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
            isMobile={isMobile}
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
