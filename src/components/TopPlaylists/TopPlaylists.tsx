import Loading from 'components/Loading'
import Paper from 'components/Paper'
import React, { useCallback } from 'react'
import { useTopPlaylists } from 'store/cache/music/hooks'
import { formatShortNumber } from 'utils/format'

import styles from './TopPlaylists.module.css'

const messages = {
  title: 'Top Playlists'
}

type OwnProps = {}

type TopPlaylistsProps = {}

const TopPlaylists: React.FC<TopPlaylistsProps> = () => {
  const { topPlaylists } = useTopPlaylists()
  const goToUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])
  return (
    <Paper className={styles.container}>
      <div className={styles.title}>{messages.title}</div>
      <div className={styles.playlists}>
        {!!topPlaylists ? (
          topPlaylists!.map((p, i) => (
            <div
              key={i}
              className={styles.playlist}
              onClick={() => goToUrl(p.url)}
            >
              <div
                className={styles.artwork}
                style={{
                  backgroundImage: `url(${p.artwork})`
                }}
              />
              <div className={styles.text}>
                <div className={styles.playlistTitle}>{p.title}</div>
                <div className={styles.handle}>{p.handle}</div>
              </div>
              <div className={styles.plays}>
                {`${formatShortNumber(p.plays)} Plays`}
              </div>
            </div>
          ))
        ) : (
          <Loading className={styles.loading} />
        )}
      </div>
    </Paper>
  )
}

export default TopPlaylists
