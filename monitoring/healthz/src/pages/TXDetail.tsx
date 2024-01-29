import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { fetcher } from '../query'
import {
  decodeEmLog,
  useEthersProvider,
  useSomeContentEndpoint,
  useSomeDiscoveryEndpoint,
} from '../utils/acdc-client'

// @ts-expect-error (so we can JSON.stringify the abi params)
BigInt.prototype.toJSON = function () {
  return this.toString() + 'n'
}

const preClass = ``
const classes = {
  chip: `niceChip`,
}

export function TxDetail() {
  const params = useParams()
  const provider = useEthersProvider()

  const { data } = useQuery([params.tx!], async () => {
    const receipt = await provider.getTransactionReceipt(params.tx!)
    if (!receipt) return {}
    const em = decodeEmLog(receipt.logs[0].data)
    return { receipt, em }
  })

  if (!data || !data.receipt || !data.em) return <div>loading</div>
  const { receipt, em } = data
  const metadata = em._metadata ? JSON.parse(em._metadata) : undefined

  return (
    <div className="nice">
      <Link to="./../.." className="block my-4 font-extrabold">
        back to logs
      </Link>

      <div className="mb-4 flex gap-2 items-center">
        <UserChip id={em._userId} signer={em._signer} />
        <div>
          {em._action} {em._entityType}
        </div>
        <ObjectChip entityType={em._entityType} entityId={em._entityId} />
      </div>

      <div className="niceCard">
        <h2>TX Receipt</h2>
        <pre className={preClass}>{JSON.stringify(receipt, undefined, 2)}</pre>
      </div>

      <div className="niceCard">
        <h2>Decoded ABI</h2>
        <pre className={preClass}>
          {JSON.stringify(em.toObject(), undefined, 2)}
        </pre>
      </div>

      {metadata ? (
        <div className="niceCard">
          <h2>_metadata</h2>
          <pre className={preClass}>
            {JSON.stringify(metadata, undefined, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  )
}

function UserChip({ id, signer }: { id: string; signer?: string }) {
  const DISCOVERY = useSomeDiscoveryEndpoint()
  const { data } = useQuery([id], async () => {
    return fetcher(`${DISCOVERY}/users?id=${id}`)
  })

  const user = data?.data[0]
  if (!user) return null
  return (
    <a
      href={`https://audius.co/${user.handle}`}
      target="_blank"
      className={classes.chip}
    >
      <CidImage
        cid={user.profile_picture_sizes || user.profile_picture}
        size={50}
      />
      <div className="">
        {user.handle}
        {signer && signer.toLowerCase() != user.wallet.toLowerCase() && (
          <div className="text-sm text-gray-800">
            signed by <span className="text-purple-800">{signer}</span>
          </div>
        )}
      </div>
    </a>
  )
}

function ObjectChip({
  entityType,
  entityId,
}: {
  entityType: string
  entityId: string
}) {
  switch (entityType) {
    case 'Track':
      return <TrackChip id={entityId} />
    case 'Album':
    case 'Playlist':
      return <PlaylistChip id={entityId} />
    case 'User':
      return <UserChip id={entityId} />
    default:
      return <div>unknown type: {entityType}</div>
  }
}

function TrackChip({ id }: { id: string }) {
  const DISCOVERY = useSomeDiscoveryEndpoint()
  const { data } = useQuery([id], async () => {
    return fetcher(`${DISCOVERY}/tracks?id=${id}`)
  })

  const track = data?.data[0]
  if (!track) return null
  return (
    <a
      href={`https://audius.co${track.permalink}`}
      target="_blank"
      className={classes.chip}
      onClick={() => console.log(track)}
    >
      <CidImage cid={track.cover_art_sizes || track.cover_art} />
      <div>{track.title}</div>
    </a>
  )
}

function PlaylistChip({ id }: { id: string }) {
  const DISCOVERY = useSomeDiscoveryEndpoint()
  const { data } = useQuery([id], async () => {
    return fetcher(`${DISCOVERY}/playlists?id=${id}`)
  })

  const playlist = data?.data[0]
  if (!playlist) return null

  return (
    <a
      href={`https://audius.co${playlist.permalink}`}
      target="_blank"
      className={classes.chip}
      onClick={() => console.log(playlist)}
    >
      <CidImage cid={playlist.playlist_image_sizes_multihash} />
      {playlist.playlist_name}
    </a>
  )
}

function CidImage({
  cid,
  size,
}: {
  cid: string | null | undefined
  size?: number
}) {
  const styleProps = {
    background: '#333',
    border: '1px solid #333',
    width: size || 50,
    height: size || 50,
    borderRadius: 1000,
  }

  const host = useSomeContentEndpoint()

  if (!cid) {
    // fallback
    return <div style={styleProps} />
  }

  return <img src={`${host}/content/${cid}/150x150.jpg`} style={styleProps} />
}
