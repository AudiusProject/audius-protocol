import { useState, useEffect, useRef, useCallback } from 'react'

import { IconVolume0, IconVolume2 } from '@audius/stems'
import cn from 'classnames'

import AudiusLogo from '../../assets/img/audiusLogoHorizontal.svg'
import { getHash } from '../../util/collectibleHelpers'
import { getScrollParent } from '../../util/scrollParent'
import { getCopyableLink } from '../../util/shareUtil'
import Button from '../button/Button'

import styles from './CollectibleDetailsView.module.css'

const MODEL_VIEWER_SCRIPT_URL =
  'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'

const messages = {
  videoNotSupported: 'Your browser does not support the video tag.'
}

const CollectibleMedia = ({ collectible, isMuted, toggleMute, isMobile }) => {
  const { mediaType, imageUrl, videoUrl, gifUrl, threeDUrl } = collectible
  const [isSvg, setIsSvg] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(
    mediaType === 'IMAGE' || mediaType === 'GIF'
  )
  const ref3D = useRef(null)

  const onLoad = () => setIsLoading(false)

  // check for svg images to give them non-empty width
  const handleImage = useCallback(
    (imageContainer) => {
      if (
        mediaType === 'IMAGE' &&
        imageUrl?.endsWith('.svg') &&
        imageContainer &&
        getComputedStyle(imageContainer).width === '0px'
      ) {
        setIsSvg(true)
      }
    },
    [mediaType, imageUrl, setIsSvg]
  )

  useEffect(() => {
    const handleScript = (e) => setScriptLoaded(e.type === 'load')

    const script = document.createElement('script')
    script.src = MODEL_VIEWER_SCRIPT_URL
    script.type = 'module'
    script.async = true
    document.body.appendChild(script)

    script.addEventListener('load', handleScript)
    script.addEventListener('error', handleScript)

    return () => {
      script.removeEventListener('load', handleScript)
      script.removeEventListener('error', handleScript)
    }
  }, [])

  useEffect(() => {
    if (threeDUrl && ref3D?.current && scriptLoaded) {
      ref3D.current.innerHTML = `<model-viewer src=${threeDUrl} auto-rotate camera-controls />`
      const modelViewer = ref3D.current.children[0]

      if (isMobile) {
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
          const scrollableAncestorElement = scrollableAncestor
          const mouseEnterListener = () =>
            (scrollableAncestorElement.style.overflowY = 'hidden')
          const mouseLeaveListener = () =>
            (scrollableAncestorElement.style.overflowY = 'scroll')
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

  return mediaType === 'THREE_D' ? (
    <div
      className={cn(styles.detailsMediaWrapper, {
        [styles.fadeIn]: !isLoading
      })}
      ref={ref3D}
    />
  ) : mediaType === 'GIF' ? (
    <div
      className={cn(styles.detailsMediaWrapper, {
        [styles.fadeIn]: !isLoading
      })}
    >
      <img src={gifUrl} alt='Collectible' onLoad={onLoad} />
    </div>
  ) : mediaType === 'VIDEO' ? (
    <div
      className={cn(styles.detailsMediaWrapper, {
        [styles.fadeIn]: !isLoading
      })}
      onClick={toggleMute}
    >
      <div style={{ position: 'relative' }}>
        <video muted={isMuted} autoPlay loop playsInline src={videoUrl}>
          {messages.videoNotSupported}
        </video>
        {isMuted ? (
          <IconVolume0 className={styles.volumeIcon} />
        ) : (
          <IconVolume2 className={styles.volumeIcon} />
        )}
      </div>
    </div>
  ) : (
    <div
      className={cn(styles.detailsMediaWrapper, {
        [styles.svg]: isSvg,
        [styles.fadeIn]: !isLoading
      })}
      ref={handleImage}
    >
      <img src={imageUrl} alt='Collectible' onLoad={onLoad} />
    </div>
  )
}

const CollectibleDetailsView = ({ collectible, user }) => {
  const [isMuted, setIsMuted] = useState(true)

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <div className={styles.imgContainer}>
          {collectible.name && (
            <CollectibleMedia
              collectible={collectible}
              isMuted={isMuted}
              isMobile={false}
              toggleMute={() => setIsMuted(!isMuted)}
            />
          )}
        </div>

        <div className={styles.nftInfo}>
          {collectible.name && (
            <h1 className={styles.header}>{collectible.name}</h1>
          )}
          {collectible.description && (
            <div className={styles.desc}>{collectible.description}</div>
          )}
          {collectible.id && (
            <div>
              <Button
                className={styles.button}
                onClick={() => {
                  window.open(
                    getCopyableLink(
                      `${user.handle}/collectibles/${getHash(collectible.id)}`
                    ),
                    '_blank'
                  )
                }}
                label='View on '
                icon={<AudiusLogo />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollectibleDetailsView
