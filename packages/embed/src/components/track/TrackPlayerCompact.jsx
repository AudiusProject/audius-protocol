import { full } from '@audius/sdk'

import Artwork from '../artwork/Artwork'
import AudiusLogoButton from '../button/AudiusLogoButton'
import ShareButton from '../button/ShareButton'
import { DogEar } from '../dog-ear/DogEar'
import PlayButton from '../playbutton/PlayButton'
import { Preview } from '../preview/Preview'
import BedtimeScrubber from '../scrubber/BedtimeScrubber'
import Titles from '../titles/Titles'

import styles from './TrackPlayerCompact.module.css'

const { instanceOfPurchaseGate } = full

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
  streamConditions,
  hasPremiumExtras
}) => {
  const isGated = !!streamConditions
  const isPurchaseable =
    streamConditions && instanceOfPurchaseGate(streamConditions)

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
          isPlayable={!isGated || isPurchaseable}
          artworkURL={albumArtURL}
          onClickURL={trackURL}
          displayHoverPlayButton={!isGated || isPurchaseable}
          onTogglePlay={onTogglePlay}
          playingState={playingState}
          iconColor={backgroundColor}
          className={styles.artwork}
        />
      </div>
      <div className={styles.trackInfo}>
        {isGated || hasPremiumExtras ? (
          <DogEar
            size='s'
            variant={
              isPurchaseable ? 'purchase' : isGated ? 'special' : 'extras'
            }
          />
        ) : null}
        <div className={styles.topSection}>
          {isPurchaseable ? <Preview /> : null}
          {!isGated || isPurchaseable ? (
            <div className={styles.scrubber}>
              <BedtimeScrubber
                mediaKey={`title-${mediaKey}`}
                playingState={playingState}
                seekTo={seekTo}
                duration={duration}
                elapsedSeconds={position}
              />
            </div>
          ) : null}
          <div className={styles.logo}>
            <AudiusLogoButton />
          </div>
        </div>
        <div className={styles.bottomSection}>
          <PlayButton
            playingState={playingState}
            onTogglePlay={onTogglePlay}
            iconColor={backgroundColor}
            isPlayable={!isGated || isPurchaseable}
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
