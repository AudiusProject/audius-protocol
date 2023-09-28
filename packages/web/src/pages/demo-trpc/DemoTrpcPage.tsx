import { trpc } from '../../services/trpc'

export default function DemoTrpcPage() {
  return (
    <div>
      <div>tRPC demo</div>
      <hr />
      {Array.from(Array(100).keys()).map((k) => (
        <User key={k} id={k.toString()} />
      ))}
    </div>
  )
}

function User({ id }: { id: string }) {
  const myId = '1'
  const { data } = trpc.users.get.useQuery(id)
  if (!data) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: 10, gap: 10 }}>
      <ProfilePicture cid={data.profilePictureSizes} />
      <div>
        <div style={{ fontSize: 32 }}>{data.name}</div>
        <div style={{ fontSize: 18, color: 'purple' }}>@{data.handle}</div>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        <FollowsYouIndicator myId={myId} theirId={id} />
        <FollowedIndicator myId={myId} theirId={id} />
      </div>
    </div>
  )
}

type UserRelationshipParams = {
  myId: string
  theirId: string
}

function FollowsYouIndicator({ myId, theirId }: UserRelationshipParams) {
  const { data } = trpc.me.userRelationship.useQuery({
    myId,
    theirId
  })
  if (!data?.followsMe) return null
  return (
    <div
      style={{
        padding: 2,
        border: '1px solid #555',
        borderRadius: 2,
        textTransform: 'uppercase'
      }}
    >
      Follows You
    </div>
  )
}

function FollowedIndicator({ myId, theirId }: UserRelationshipParams) {
  const { data } = trpc.me.userRelationship.useQuery({
    myId,
    theirId
  })
  if (!data?.followed) return null
  return (
    <div
      style={{
        padding: 2,
        border: '1px solid #555',
        borderRadius: 2,
        textTransform: 'uppercase'
      }}
    >
      Followed
    </div>
  )
}

function SubscriptionIndicator({ myId, theirId }: UserRelationshipParams) {}

// ==================== junk ====================

function ProfilePicture({
  cid,
  size
}: {
  cid: string | null | undefined
  size?: string
}) {
  const styleProps = {
    background: '#333',
    borderRadius: 1000,
    border: '1px solid #ccc',
    width: 100,
    height: 100
  }

  if (!cid) {
    // fallback
    return <div style={styleProps} />
  }

  const host =
    process.env.REACT_APP_ENVIRONMENT == 'staging'
      ? 'https://creatornode12.staging.audius.co'
      : 'https://creatornode2.audius.co'

  size ||= '150x150'

  return <img src={`${host}/content/${cid}/${size}.jpg`} style={styleProps} />
}
