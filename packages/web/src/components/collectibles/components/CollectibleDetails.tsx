import {
  profilePageSelectors,
  collectibleDetailsUIActions
} from '@audius/common/store'

import { useCallback, useEffect, useState } from 'react'

import { Chain, CollectibleMediaType, Collectible } from '@audius/common/models'
import { getHash } from '@audius/common/utils'
import { LogoEth, LogoSol } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import IconPlay from 'assets/img/pbIconPlay.svg'
import { useModalState } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import PerspectiveCard from 'components/perspective-card/PerspectiveCard'
import PreloadImage from 'components/preload-image/PreloadImage'
import { preload } from 'utils/image'

import { getFrameFromGif } from '../ethCollectibleHelpers'

import styles from './CollectiblesPage.module.css'
const { setCollectible } = collectibleDetailsUIActions
const { getProfileUserHandle } = profilePageSelectors

type CollectibleDetailsProps = {
  collectible: Collectible
  onClick: () => void
}

const CollectibleDetails = (props: CollectibleDetailsProps) => {
  const { collectible, onClick } = props
  const dispatch = useDispatch()
  const { mediaType, frameUrl, videoUrl, gifUrl, name } = collectible

  const [isLoading, setIsLoading] = useState(true)
  const [frame, setFrame] = useState(frameUrl)
  const [showSpinner, setShowSpinner] = useState(false)
  const [, setIsModalOpen] = useModalState('CollectibleDetails')

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

  const handle = useSelector(getProfileUserHandle)
  const handleItemClick = useCallback(() => {
    // Ignore needed bc typescript doesn't think that match.params has handle property
    // @ts-ignore
    const url = `/${handle}/collectibles/${getHash(collectible.id)}`
    // Push window state as to not trigger router change & component remount
    window.history.pushState('', '', url)
    dispatch(setCollectible({ collectible }))
    setIsModalOpen(true)
    onClick()
  }, [collectible, handle, dispatch, setIsModalOpen, onClick])

  const collectibleChainElement = (
    <div className={styles.chain}>
      {collectible.chain === Chain.Eth ? (
        <LogoEth height={18} />
      ) : (
        <LogoSol height={16} />
      )}
    </div>
  )

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
                  {collectibleChainElement}
                </div>
              )}
              {mediaType === CollectibleMediaType.VIDEO &&
                !frame &&
                videoUrl && (
                  <div className={cn(styles.media, styles.imageWrapper)}>
                    <IconPlay className={styles.playIcon} />
                    <video
                      style={{ height: '100%', width: '100%' }}
                      src={`${videoUrl}#t=0.1`}
                    />
                    {collectibleChainElement}
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
                  {collectibleChainElement}
                </div>
              )}
            </>
          )}
        </>
        <div className={styles.nftTitle}>{collectible.name}</div>
      </PerspectiveCard>
    </div>
  )
}

export default CollectibleDetails
