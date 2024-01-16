import Artwork from '../artwork/Artwork'
import AudiusLogoButton from '../button/AudiusLogoButton'
import ShareButton from '../button/ShareButton'
import { DogEar } from '../dog-ear/DogEar'
import PlayButton from '../playbutton/PlayButton'
import { Preview } from '../preview/Preview'
import BedtimeScrubber from '../scrubber/BedtimeScrubber'
import Titles from '../titles/Titles'

import styles from './TrackPlayerCompact.module.css'

const TrackPlayerCompact = ({
  title,
  mediaKey,
  handle,
  artistName,
  trackURL,
  playingState,
  onTogglePlay,
  albumArtURL,
  isVerified,
  position,
  duration,
  seekTo,
  backgroundColor,
  streamConditions
}) => {
  const isPurchaseable =
    streamConditions && 'usdc_purchase' in streamConditions

  return (
    <div
      className={styles.container}
      style={{
        backgroundColor
      }}
    >
      <div className={styles.shareButton} />
      <div className={styles.artworkWrapper}>
        <Artwork
          artworkURL={albumArtURL}
          onClickURL={trackURL}
          displayHoverPlayButton={true}
          onTogglePlay={onTogglePlay}
          playingState={playingState}
          iconColor={backgroundColor}
          className={styles.artwork}
        />
      </div>
      <div className={styles.trackInfo}>
        {isPurchaseable ? <DogEar size='s' /> : null}
        <div className={styles.topSection}>
          {isPurchaseable ? <Preview /> : null}
          <div className={styles.scrubber}>
            <BedtimeScrubber
              mediaKey={`title-${mediaKey}`}
              playingState={playingState}
              seekTo={seekTo}
              duration={duration}
              elapsedSeconds={position}
            />
          </div>
          <div className={styles.logo}>
            <AudiusLogoButton />
          </div>
        </div>
        <div className={styles.bottomSection}>
          <PlayButton
            playingState={playingState}
            onTogglePlay={onTogglePlay}
            iconColor={backgroundColor}
          />
          <div className={styles.titleContainer}>
            <Titles
              title={title}
              artistName={artistName}
              handle={handle}
              isVerified={isVerified}
              titleUrl={trackURL}
            />
          </div>
          <div className={styles.shareButtonHolder}>
            <ShareButton url={trackURL} creator={artistName} title={title} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackPlayerCompact
