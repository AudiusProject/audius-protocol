import {
  ID,
  SquareSizes,
  Track,
  cacheUsersSelectors,
  useGetSuggestedTracks
} from '@audius/common'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconButton,
  IconCaretDown,
  IconRefresh
} from '@audius/stems'
import { animated, useSpring } from '@react-spring/web'
import cn from 'classnames'
import { useToggle } from 'react-use'

import { Divider } from 'components/divider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Skeleton from 'components/skeleton/Skeleton'
import { Tile } from 'components/tile'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { useSelector } from 'utils/reducer'

import styles from './SuggestedTracks.module.css'

const { getUser } = cacheUsersSelectors

const contentHeight = 423

const messages = {
  title: 'Add some tracks',
  addTrack: 'Add',
  refresh: 'Refresh',
  expandLabel: 'Expand suggested tracks panel',
  collapseLabel: 'Collapse suggested tracks panel'
}

type SuggestedTrackProps = {
  collectionId: ID
  track: Track
  onAddTrack: (trackId: ID, collectionId: ID) => void
}

const SuggestedTrack = (props: SuggestedTrackProps) => {
  const { collectionId, track, onAddTrack } = props
  const { track_id, title, owner_id } = track
  const user = useSelector((state) => getUser(state, { id: owner_id }))

  const image = useTrackCoverArt2(track_id, SquareSizes.SIZE_150_BY_150)

  return (
    <div className={styles.suggestedTrack}>
      <div className={styles.trackDetails}>
        <img src={image} className={styles.trackArtwork} role='presentation' />
        <div className={styles.trackInfo}>
          <p className={styles.trackName}>{title}</p>
          {user ? <UserNameAndBadges user={user} /> : null}
        </div>
      </div>
      <Button
        type={ButtonType.COMMON}
        text={messages.addTrack}
        size={ButtonSize.SMALL}
        onClick={() => onAddTrack(track_id, collectionId)}
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
}

export const SuggestedTracks = (props: SuggestedTracksProps) => {
  const { collectionId } = props
  const { suggestedTracks, onRefresh, onAddTrack } =
    useGetSuggestedTracks(collectionId)

  const [isExpanded, toggleIsExpanded] = useToggle(false)

  const divider = <Divider className={styles.trackDivider} />

  const contentStyles = useSpring({
    maxHeight: isExpanded ? contentHeight : 0
  })

  return (
    <Tile className={styles.root} elevation='mid'>
      <div className={styles.heading}>
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
          onClick={toggleIsExpanded}
        />
      </div>
      <animated.div className={styles.content} style={contentStyles}>
        <ul>
          {divider}
          {!suggestedTracks ? (
            <LoadingSpinner className={styles.loading} />
          ) : null}
          {suggestedTracks?.map((suggestedTrack) => (
            <li key={suggestedTrack.id}>
              {suggestedTrack.track ? (
                <SuggestedTrack
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
          {divider}
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
