import { useCallback } from 'react'

import { cacheUsersSelectors } from '@audius/common'
import { SuggestedTrack } from '@audius/common/api'
import { SquareSizes, ID, Track } from '@audius/common/models'
import type {} from '@audius/common'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconButton,
  IconRefresh
} from '@audius/stems'
import { animated, useSpring } from '@react-spring/web'
import cn from 'classnames'
import { useToggle } from 'react-use'

import IconCaretDown from 'assets/img/iconCaretDownLine.svg'
import { Divider } from 'components/divider'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Skeleton from 'components/skeleton/Skeleton'
import { Tile } from 'components/tile'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { useSelector } from 'utils/reducer'

import styles from './SuggestedTracks.module.css'

const { getUser } = cacheUsersSelectors

const messages = {
  title: 'Add some tracks',
  addTrack: 'Add',
  refresh: 'Refresh',
  expandLabel: 'Expand suggested tracks panel',
  collapseLabel: 'Collapse suggested tracks panel',
  trackAdded: (isAlbum: boolean) => `Added to ${isAlbum ? 'Album' : 'Playlist'}`
}

type SuggestedTrackProps = {
  collectionId: ID
  track: Track
  onAddTrack: (trackId: ID) => void
}

const SuggestedTrackRow = (props: SuggestedTrackProps) => {
  const { track, onAddTrack } = props
  const { track_id, title, owner_id } = track
  const user = useSelector((state) => getUser(state, { id: owner_id }))
  const image = useTrackCoverArt2(track_id, SquareSizes.SIZE_150_BY_150)

  const handleAddTrack = useCallback(() => {
    onAddTrack(track_id)
  }, [onAddTrack, track_id])

  return (
    <div className={styles.suggestedTrack}>
      <div className={styles.trackDetails}>
        <DynamicImage wrapperClassName={styles.trackArtwork} image={image} />
        <div className={styles.trackInfo}>
          <p className={styles.trackName}>{title}</p>
          {user ? (
            <UserNameAndBadges
              classes={{ name: styles.artistName }}
              user={user}
            />
          ) : null}
        </div>
      </div>
      <Button
        type={ButtonType.COMMON}
        text={messages.addTrack}
        size={ButtonSize.SMALL}
        onClick={handleAddTrack}
      />
    </div>
  )
}

const SuggestedTrackSkeleton = () => {
  return (
    <div className={styles.suggestedTrackSkeleton}>
      <div className={styles.trackDetails}>
        <Skeleton className={styles.trackArtwork} />
        <div className={styles.trackInfo}>
          <Skeleton height='12px' width='150px' />
          <Skeleton height='12px' width='100px' />
        </div>
      </div>
    </div>
  )
}

type SuggestedTracksProps = {
  collectionId: ID
  suggestedTracks: SuggestedTrack[]
  onRefresh: () => void
  onAddTrack: (trackId: ID) => void
  isRefreshing: boolean
}

export const SuggestedTracks = (props: SuggestedTracksProps) => {
  const { collectionId, suggestedTracks, onRefresh, onAddTrack, isRefreshing } =
    props
  const [isExpanded, toggleIsExpanded] = useToggle(false)

  const divider = <Divider className={styles.trackDivider} />

  const contentHeight = 66 + suggestedTracks.length * 74
  const contentStyles = useSpring({
    height: isExpanded ? contentHeight : 0
  })

  return (
    <Tile className={styles.root} elevation='mid'>
      <div className={styles.heading} onClick={toggleIsExpanded}>
        <div className={styles.headingText}>
          <h4 className={styles.title}>{messages.title}</h4>
        </div>
        <IconButton
          aria-label={
            isExpanded ? messages.collapseLabel : messages.expandLabel
          }
          icon={
            <IconCaretDown
              className={cn(styles.caret, {
                [styles.caretExpanded]: isExpanded
              })}
            />
          }
        />
      </div>
      <animated.div className={styles.content} style={contentStyles}>
        <ul>
          {divider}
          {!suggestedTracks ? (
            <LoadingSpinner className={styles.loading} />
          ) : null}
          {suggestedTracks?.map((suggestedTrack) => (
            <li key={suggestedTrack.key}>
              {!isRefreshing && 'track' in suggestedTrack ? (
                <SuggestedTrackRow
                  track={suggestedTrack.track}
                  collectionId={collectionId}
                  onAddTrack={onAddTrack}
                />
              ) : (
                <SuggestedTrackSkeleton />
              )}
              {divider}
            </li>
          ))}
        </ul>
        <button className={styles.refreshButton} onClick={onRefresh}>
          <div className={styles.refreshContent}>
            <IconRefresh className={styles.refreshIcon} />
            <span className={styles.refreshText}>{messages.refresh}</span>
          </div>
        </button>
      </animated.div>
    </Tile>
  )
}
