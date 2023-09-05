import cn from 'classnames'

import { ReactComponent as IconPlus } from 'assets/img/iconMultiselectAdd.svg'
import { ReactComponent as IconUpload } from 'assets/img/iconUpload.svg'

import styles from './UploadChip.module.css'

const messages = {
  track: 'Upload Track',
  aTrack: 'Upload A Track',
  album: 'Upload New Album',
  playlist: 'Create New Playlist',
  artistPlaylist: 'Upload New Playlist',
  firstAlbum: 'Upload Your First Album',
  firstPlaylist: 'Create Your First Playlist',
  firstArtistPlaylist: 'Upload Your First Playlist'
}

type UploadChipProps = {
  type?: 'track' | 'album' | 'playlist'
  /**
   * nav: For display in a nav-like column
   *
   * card: Looks like a 'Card'
   *
   * tile: Looks like a 'TrackTile'
   */
  variant?: 'nav' | 'card' | 'tile'
  /**
   * Is this upload the user's first of this type
   * */
  isFirst?: boolean
  onClick: () => void
  isArtist?: boolean
}

const UploadChip = ({
  type = 'track',
  variant = 'tile',
  isArtist = false,
  isFirst = false,
  onClick
}: UploadChipProps) => {
  const icon =
    type === 'track' || type === 'album' ? (
      <IconUpload className={styles.iconUpload} />
    ) : (
      <IconPlus className={styles.iconPlus} />
    )

  let text
  switch (type) {
    case 'track':
      text = variant === 'nav' ? messages.track : messages.aTrack
      break
    case 'album':
      text = isFirst ? messages.firstAlbum : messages.album
      break
    case 'playlist':
      if (isArtist) {
        text = isFirst ? messages.firstArtistPlaylist : messages.artistPlaylist
      } else {
        text = isFirst ? messages.firstPlaylist : messages.playlist
      }
      break
    default:
      break
  }

  return (
    <div
      className={cn(styles.uploadChip, {
        [styles.nav]: variant === 'nav',
        [styles.card]: variant === 'card',
        [styles.tile]: variant === 'tile'
      })}
      onClick={onClick}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>{text}</div>
    </div>
  )
}

export default UploadChip
