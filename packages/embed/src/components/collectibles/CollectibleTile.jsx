import { useEffect, useState } from 'react'

import cn from 'classnames'

import { getFrameFromGif } from '../../util/collectibleHelpers'
import { logError } from '../../util/logError'

import styles from './CollectibleTile.module.css'

const preload = async (src) =>
  new Promise((resolve) => {
    const i = new Image()
    i.onload = resolve
    i.onerror = resolve
    i.src = src
  })

const CollectibleTile = ({ collectible, onClick }) => {
  const { mediaType, frameUrl, videoUrl, gifUrl, name } = collectible
  const [isHidden, setIsHidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [frame, setFrame] = useState(frameUrl)

  useEffect(() => {
    const load = async () => {
      let f = frameUrl
      if (!f && ['GIF', 'THREE_D'].includes(mediaType)) {
        f = await getFrameFromGif(gifUrl, name || '')
      } else if (!f && mediaType === 'VIDEO') {
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

  if (isHidden) return false

  return (
    <div className={styles.imgContainer}>
      {!isLoading && (
        <div
          className={cn(styles.imageWrapper, { [styles.fadeIn]: !isLoading })}
          onClick={onClick}
        >
          {mediaType === 'VIDEO' && !frame && videoUrl ? (
            <video className={styles.video} src={`${videoUrl}#t=0.1`} />
          ) : (
            <img
              className={styles.image}
              src={frame}
              onError={() => {
                logError(`Error loading: ${name}`)
                setIsHidden(true)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default CollectibleTile
