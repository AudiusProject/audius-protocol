import { useState } from 'react'

import { RouterOutput } from '@audius/trpc-server'
import { Link } from 'react-router-dom'

import { trpc } from 'utils/trpcClientWeb'

import { CidImage } from './DemoTrpcPage'
import styles from './TrpcHistory.module.css'

type HistoryRow = RouterOutput['me']['playHistory'][0]

const LIMIT = 500

export default function TrpcHistoryPage() {
  const fetcher = trpc.me.playHistory.useInfiniteQuery(
    {
      limit: LIMIT
    },
    {
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length === LIMIT) {
          const val = allPages.reduce((acc, page) => acc + page.length, 0)
          return val
        }
      }
    }
  )
  return (
    <div className={styles.historyPage}>
      <table className={styles.history}>
        <thead>
          <tr>
            <th></th>
            <th>Track Name</th>
            <th>Artist</th>
            <th className={styles.right}>Released</th>
            <th className={styles.right}>Played</th>
            <th className={styles.right}>Length</th>
            <th className={styles.right}>Plays</th>
            <th className={styles.right}>Reposts</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        {fetcher.data?.pages.map((page, idx) => (
          <tbody key={idx}>
            {page.map((row, idx2) => (
              <HistoryTR key={idx2} row={row} />
            ))}
          </tbody>
        ))}
      </table>
      <div style={{ paddingBottom: 50 }}>
        {fetcher.hasNextPage ? (
          <button onClick={() => fetcher.fetchNextPage()}>More</button>
        ) : null}
      </div>
    </div>
  )
}

function HistoryTR({ row }: { row: HistoryRow }) {
  const { data: myStatus } = trpc.me.trackRelationship.useQuery(
    row.trackId.toString()
  )
  return (
    <tr>
      <td></td>
      <td>
        {/* todo: turns out route_id is half busted... where to get actual route?  */}
        <Link to={'/' + row.routeId}>{row.trackName}</Link>
      </td>
      <td>
        {/* todo: artist popover */}
        <Link to={'/' + row.artistHandle}>{row.artistName}</Link>
      </td>
      <td className={styles.right}>{formatDate(row.releaseDate)}</td>
      <td className={styles.right}>{formatDate(row.playDate)}</td>
      <td className={styles.right}>{row.duration}</td>
      <td className={styles.right}>
        <TopListenersPopover trackId={row.trackId} playCount={row.playCount} />
      </td>
      <td className={styles.right}>{row.repostCount}</td>
      {/* todo: save + repost buttons with icons */}
      <td>{myStatus?.saved ? 'saved' : ''}</td>
      <td>{myStatus?.reposted ? 'reposted' : ''}</td>
      {/* todo: ... menu */}
    </tr>
  )
}

function TopListenersPopover({
  trackId,
  playCount
}: {
  trackId: number
  playCount: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const { data: topListeners, isLoading } = trpc.tracks.topListeners.useQuery(
    {
      trackId
    },
    {
      enabled: isHovered
    }
  )

  return (
    <div
      className={styles.topListener}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && !isLoading ? (
        <div className={styles.topListenerPopover}>
          {topListeners?.map((t) => (
            <div key={t.userId} className={styles.topListenerRow}>
              <CidImage
                cid={t.profilePictureSizes || t.profilePicture}
                size={30}
              />
              <div style={{ flexGrow: 1 }}>
                <Link to={'/' + t.handle}>{t.name}</Link>
              </div>
              <div style={{ textAlign: 'right' }}>{t.playCount}</div>
            </div>
          ))}
        </div>
      ) : null}
      {playCount}
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString()
}
