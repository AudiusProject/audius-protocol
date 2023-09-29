import { CSSProperties, useMemo, useState } from 'react'

import {
  loadCurrentUserId,
  storeCurrentUserId,
  trpc
} from '../../services/trpc'

// ==================== Page ====================

export default function DemoTrpcPage() {
  const pageSize = 50
  const [offset, setOffset] = useState(1)
  const [myId, setMyId] = useState(() => loadCurrentUserId())
  const utils = trpc.useContext()

  const idRange = Array.from(Array(pageSize).keys()).map((i) => i + offset)

  function updateMyId(val: string) {
    storeCurrentUserId(val)
    setMyId(val)
    // force tRPC to reload all "me" stuff
    utils.me.invalidate()
  }

  return (
    <div style={{ padding: 0 }}>
      <div
        style={{
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          background: 'aliceblue',
          padding: 20
        }}
      >
        <div style={{ fontWeight: 900 }}>tRPC demo</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          User ID
          <input
            type='number'
            value={myId}
            onChange={(e) => updateMyId(e.target.value)}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginLeft: 10
          }}
        >
          <button onClick={() => setOffset(Math.max(offset - pageSize, 1))}>
            prev
          </button>
          {offset}
          <button onClick={() => setOffset(offset + pageSize)}>next</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, padding: 10 }}>
        <div>
          <div style={{ fontWeight: 900 }}>Users</div>
          {idRange.map((k) => (
            <User key={k} id={k.toString()} />
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 900 }}>Tracks</div>
          {idRange.map((k) => (
            <Track key={k} id={k.toString()} />
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 900 }}>Playlists</div>
          {idRange.map((k) => (
            <Playlist key={k} id={k.toString()} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== Reused Styles ====================
const tagStyle: CSSProperties = {
  padding: 2,
  border: '1px solid #555',
  textTransform: 'uppercase',
  fontSize: 10,
  fontWeight: 700,
  whiteSpace: 'nowrap'
}

const cardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 15,

  padding: 10,
  background: 'white',
  border: '1px solid #333',
  boxShadow: '4px 4px #aaa'
}

// ==================== User stuff ====================

function User({ id }: { id: string }) {
  const { data } = trpc.users.get.useQuery(id)
  if (!data) return null
  return (
    <div style={cardStyle}>
      <CidImage cid={data.profilePictureSizes || data.profilePicture} />
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>{data.name}</div>
        <div style={{ fontSize: 18, color: 'purple' }}>@{data.handle}</div>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        <FollowsYouIndicator theirId={id} />
        <FollowedIndicator theirId={id} />
      </div>
    </div>
  )
}

type UserRelationshipParams = {
  theirId: string
}

function FollowsYouIndicator({ theirId }: UserRelationshipParams) {
  const { data } = trpc.me.userRelationship.useQuery({
    theirId
  })
  if (!data?.followsMe) return null
  return <div style={tagStyle}>Follows You</div>
}

function FollowedIndicator({ theirId }: UserRelationshipParams) {
  const { data } = trpc.me.userRelationship.useQuery({
    theirId
  })
  if (!data?.followed) return null
  return <div style={tagStyle}>Followed</div>
}

// ==================== Track stuff ====================

function Track({ id }: { id: string }) {
  const { data: track } = trpc.tracks.get.useQuery(id)
  const { data: user } = trpc.users.get.useQuery(
    track?.ownerId.toString() || '',
    {
      enabled: !!track?.ownerId
    }
  )
  if (!track || !user) return null
  return (
    <div style={cardStyle}>
      <CidImage cid={track.coverArtSizes || track.coverArt} />

      <div style={{ flexGrow: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>{track.title}</div>
        <div style={{ fontSize: 18, color: 'purple' }}>
          by {user.name || user.handle}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        <SaveIndicator kind='track' id={id} />
        <RepostIndicator kind='track' id={id} />
      </div>
    </div>
  )
}

// ==================== Playlist stuff ====================

function Playlist({ id }: { id: string }) {
  const { data: playlist } = trpc.playlists.get.useQuery(id)
  const { data: user } = trpc.users.get.useQuery(
    playlist?.playlistOwnerId.toString() || '',
    {
      enabled: !!playlist?.playlistOwnerId
    }
  )

  // get track ids
  const trackIds = useMemo(() => playlistTrackIds(playlist), [playlist])

  if (!playlist || !user) return null
  return (
    <div style={{ ...cardStyle, display: 'block', padding: 0 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}
      >
        <CidImage
          cid={
            playlist.playlistImageSizesMultihash ||
            playlist.playlistImageMultihash
          }
        />
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {playlist.playlistName}
          </div>
          <div style={{ fontSize: 18, color: 'purple' }}>
            by {user.name || user.handle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <SaveIndicator kind='playlist' id={id} />
          <RepostIndicator kind='playlist' id={id} />
        </div>
      </div>

      <div>
        {trackIds?.map((id, idx) => (
          <PlaylistTrack key={id} idx={idx + 1} id={id} />
        ))}
      </div>
    </div>
  )
}

function PlaylistTrack({ idx, id }: { idx: number; id: string }) {
  const { data: track } = trpc.tracks.get.useQuery(id)
  const { data: user } = trpc.users.get.useQuery(
    track?.ownerId.toString() || '',
    {
      enabled: !!track?.ownerId
    }
  )
  if (!track || !user) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: 5,
        alignItems: 'center',
        padding: '8px 10px',
        borderTop: '1px solid #ccc'
      }}
    >
      <div style={{ flexGrow: 1, display: 'flex', gap: 10 }}>
        <span style={{ color: '#ccc' }}>{idx}</span>
        <span style={{ fontWeight: 900 }}>{track.title}</span>
        <span style={{ color: 'purple' }}>by {user.name || user.handle}</span>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        <SaveIndicator kind='track' id={id} />
        <RepostIndicator kind='track' id={id} />
      </div>
    </div>
  )
}

type PlaylistContents = {
  trackIds: {
    track: string
  }[]
}

// this no work for some reason:
// playlist: GetPlaylistOutput | undefined
export function playlistTrackIds(playlist: any) {
  const contents = playlist?.playlistContents as PlaylistContents
  if (!contents) return
  const trackIds = contents.trackIds.map((t) => t.track.toString())
  return Array.from(new Set(trackIds))
}

// ==================== Save / Repost stuff ====================

type SaveRepostParams = {
  kind: 'track' | 'playlist'
  id: string
}

function SaveIndicator({ kind, id }: SaveRepostParams) {
  const { data } = trpc.me.actions.useQuery({ kind, id })
  if (!data?.saved) return null
  return <div style={tagStyle}>Saved</div>
}

function RepostIndicator({ kind, id }: SaveRepostParams) {
  const { data } = trpc.me.actions.useQuery({ kind, id })
  if (!data?.reposted) return null
  return <div style={tagStyle}>Reposted</div>
}

// ==================== Image stuff ====================

function CidImage({
  cid,
  size
}: {
  cid: string | null | undefined
  size?: number
}) {
  const styleProps = {
    background: '#333',
    border: '1px solid #333',
    width: size || 75,
    height: size || 75
  }

  if (!cid) {
    // fallback
    return <div style={styleProps} />
  }

  const host =
    process.env.REACT_APP_ENVIRONMENT === 'staging'
      ? 'https://creatornode12.staging.audius.co'
      : 'https://creatornode2.audius.co'

  return <img src={`${host}/content/${cid}/150x150.jpg`} style={styleProps} />
}
