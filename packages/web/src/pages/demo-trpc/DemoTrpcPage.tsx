import { trpc } from '../../services/trpc'

export default function DemoTrpcPage() {
  return (
    <div>
      <div>tRPC demo</div>
      <hr />
      <User id='1' />
      <User id='2' />
    </div>
  )
}

function User({ id }: { id: string }) {
  const { data } = trpc.users.get.useQuery(id)
  if (!data) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: 10 }}>
      <img
        src={`https://creatornode2.audius.co/content/${data.profilePictureSizes}/150x150.jpg`}
        style={{
          borderRadius: 1000,
          border: '1px solid #ccc',
          width: 100,
          marginRight: 10
        }}
      />
      <div>
        <div style={{ fontSize: 32 }}>{data.name}</div>
        <div style={{ fontSize: 18, color: 'purple' }}>@{data.handle}</div>
      </div>
    </div>
  )
}
