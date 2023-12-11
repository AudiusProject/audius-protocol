import { CSSProperties, Suspense, useMemo, useState } from 'react'

import { accountSelectors } from '@audius/common'
import { RouterInput } from '@audius/trpc-server'
import { useSelector } from 'react-redux'
import { create } from 'zustand'

import { trpc } from 'utils/trpcClientWeb'

// ==================== Store ====================

type SocialQuery = RouterInput['users']['listUserIds']

interface SocialModalState {
  socialQuery: SocialQuery | undefined
  showSocialModal: (q: SocialQuery | undefined) => void
}

export const useSocialModal = create<SocialModalState>()((set) => ({
  socialQuery: undefined,
  showSocialModal: (socialQuery) =>
    set((state) => {
      return { socialQuery }
    })
}))

// ==================== Page ====================

export default function DemoTrpcPage() {
  const pageSize = 20
  const [offset, setOffset] = useState(1)

  const idRange = Array.from(Array(pageSize).keys()).map((i) => i + offset)

  return (
    <div style={{ padding: 0, width: '100%' }}>
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

      <UserListModal />

      <Suspense fallback={<Loading />}>
        <CurrentUserIndicator />

        <div style={{ display: 'flex', gap: 20, padding: 10 }}>
          <div style={stackStyle}>
            <div style={{ fontWeight: 900 }}>Users</div>
            {idRange.map((k) => (
              <User key={k} id={k.toString()} />
            ))}
          </div>
          <div style={stackStyle}>
            <div style={{ fontWeight: 900 }}>Tracks</div>
            {idRange.map((k) => (
              <Track key={k} id={k.toString()} />
            ))}
          </div>
          <div style={stackStyle}>
            <div style={{ fontWeight: 900 }}>Playlists</div>
            {idRange.map((k) => (
              <Playlist key={k} id={k.toString()} />
            ))}
          </div>
        </div>
      </Suspense>
    </div>
  )
}

function CurrentUserIndicator() {
  const currentUserId = useSelector(accountSelectors.getUserId)
  if (!currentUserId) return null
  return (
    <User
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'lightyellow'
      }}
      id={currentUserId.toString()}
    />
  )
}

function UserListModal() {
  const limit = 20
  const state = useSocialModal()
  const fetcher = trpc.users.listUserIds.useInfiniteQuery(
    { ...state.socialQuery!, limit },
    {
      enabled: !!state.socialQuery,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.ids.length === limit) {
          const val = allPages.reduce((acc, page) => acc + page.ids.length, 0)
          return val
        }
      }
    }
  )
  if (!state.socialQuery) return null

  // @ts-ignore
  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1
        }}
        onClick={() => state.showSocialModal(undefined)}
      ></div>
      <div
        style={{
          position: 'fixed',
          top: 100,
          bottom: 100,
          left: '50%',
          width: 500,
          overflow: 'auto',
          marginLeft: -250,
          background: 'white',
          zIndex: 2,
          padding: 10
        }}
      >
        <div
          style={{
            padding: 10,
            background: 'purple',
            color: 'white',
            marginBottom: 10
          }}
        >
          {state.socialQuery.verb}
        </div>

        {fetcher.data?.pages.map((page, idx) => (
          <div key={idx}>
            <Suspense fallback={<Loading />}>
              {page.ids.map((id) => (
                <User
                  key={id}
                  id={id.toString()}
                  style={{
                    boxShadow: 'none',
                    border: 'none',
                    borderBottom: '1px solid #aaa'
                  }}
                />
              ))}
            </Suspense>
          </div>
        ))}

        {fetcher.isFetching ? <Loading /> : null}

        <div style={{ padding: 20, textAlign: 'center' }}>
          {fetcher.hasNextPage && !fetcher.isFetching ? (
            <button onClick={() => fetcher.fetchNextPage()}>more</button>
          ) : null}
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

  padding: 10,
  background: 'white',
  border: '1px solid #333',
  boxShadow: '4px 4px #aaa'
}

const stackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 15
}

// ==================== User stuff ====================

function User({ id, style }: { id: string; style?: CSSProperties }) {
  const { data } = trpc.users.get.useQuery(id, {
    suspense: true
  })
  if (!data) return null
  return (
    <div style={{ ...cardStyle, ...style }}>
      <CidImage cid={data.profilePictureSizes || data.profilePicture} />
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>{data.name}</div>
        <div style={{ fontSize: 18, color: 'purple' }}>@{data.handle}</div>
        <div style={{ display: 'flex', fontSize: 10, color: '#555', gap: 5 }}>
          <SocialCount
            verb='follow'
            kind='user'
            id={id}
            count={parseInt(data.followerCount || '0')}
          />
          <SocialCount
            verb='followedBy'
            kind='user'
            id={id}
            count={parseInt(data.followingCount || '0')}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FollowsYouIndicator theirId={id} />
        <FollowedIndicator theirId={id} />
        <MututalFollows theirId={id} suspense={false} />
      </div>
    </div>
  )
}

type UserRelationshipParams = {
  theirId: string
  suspense?: boolean
}

function FollowsYouIndicator({
  theirId,
  suspense = true
}: UserRelationshipParams) {
  const { data } = trpc.me.userRelationship.useQuery({ theirId }, { suspense })
  if (!data?.followsMe) return null
  return <div style={tagStyle}>Follows You</div>
}

function FollowedIndicator({
  theirId,
  suspense = true
}: UserRelationshipParams) {
  const { data } = trpc.me.userRelationship.useQuery({ theirId }, { suspense })
  if (!data?.followed) return null
  return <div style={tagStyle}>Followed</div>
}

function MututalFollows({ theirId, suspense = true }: UserRelationshipParams) {
  const socialQuery: SocialQuery = {
    verb: 'mutualFollows',
    kind: 'user',
    id: theirId
  }
  const { showSocialModal } = useSocialModal()
  const { data } = trpc.users.listUserIds.useQuery(socialQuery, { suspense })
  if (!data?.count) return null
  return (
    <div style={tagStyle} onClick={() => showSocialModal(socialQuery)}>
      {data.count} mutuals
    </div>
  )
}

// ==================== Track stuff ====================

function Track({ id }: { id: string }) {
  const { data: track } = trpc.tracks.get.useQuery(id, { suspense: true })
  const { data: user } = trpc.users.get.useQuery(
    track?.ownerId.toString() || '',
    {
      enabled: !!track?.ownerId,
      suspense: true
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
        <div style={{ display: 'flex', fontSize: 10, color: '#555', gap: 5 }}>
          <SocialCount
            verb='reposted'
            kind='track'
            id={id}
            count={track.repostCount}
          />
          <SocialCount
            verb='saved'
            kind='track'
            id={id}
            count={track.saveCount}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        <SaveIndicator kind='track' id={id} />
        <RepostIndicator kind='track' id={id} />
      </div>
    </div>
  )
}

function SocialCount(props: SocialQuery & { count?: number | null }) {
  const userModal = useSocialModal()
  if (!props.count) return null
  return (
    <div onClick={() => userModal.showSocialModal(props)}>
      {props.count} {props.verb}
    </div>
  )
}

// ==================== Playlist stuff ====================

function Playlist({ id }: { id: string }) {
  const { data: playlist } = trpc.playlists.get.useQuery(id, { suspense: true })
  const { data: user } = trpc.users.get.useQuery(
    playlist?.playlistOwnerId.toString() || '',
    {
      enabled: !!playlist?.playlistOwnerId,
      suspense: true
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

          <div style={{ display: 'flex', fontSize: 10, color: '#555', gap: 5 }}>
            <SocialCount
              verb='reposted'
              kind='playlist'
              id={id}
              count={playlist.repostCount}
            />
            <SocialCount
              verb='saved'
              kind='playlist'
              id={id}
              count={playlist.saveCount}
            />
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
  const { data: track } = trpc.tracks.get.useQuery(id, {
    suspense: true
  })
  const { data: user } = trpc.users.get.useQuery(
    track?.ownerId.toString() || '',
    {
      enabled: !!track?.ownerId,
      suspense: true
    }
  )
  if (!user || !track) return null
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
        <SaveIndicator kind='track' id={id} suspense={false} />
        <RepostIndicator kind='track' id={id} suspense={false} />
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
  suspense?: boolean
}

function SaveIndicator({ kind, id, suspense = true }: SaveRepostParams) {
  const { data } = trpc.me.actions.useQuery({ kind, id }, { suspense })
  if (!data?.saved) return null
  return <div style={tagStyle}>Saved</div>
}

function RepostIndicator({ kind, id, suspense = true }: SaveRepostParams) {
  const { data } = trpc.me.actions.useQuery({ kind, id }, { suspense })
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
    process.env.VITE_ENVIRONMENT === 'staging'
      ? 'https://creatornode12.staging.audius.co'
      : 'https://creatornode2.audius.co'

  return <img src={`${host}/content/${cid}/150x150.jpg`} style={styleProps} />
}

function Loading() {
  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: 48,
        padding: 50,
        color: '#aaa',
        textTransform: 'uppercase'
      }}
    >
      Loading
    </div>
  )
}
