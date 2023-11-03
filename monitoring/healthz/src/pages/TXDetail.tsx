import { AudiusABIDecoder } from '@audius/sdk/dist/web-libs'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Web3 } from 'web3'
import { abiParamsToObject } from './TX'
import { fetcher } from '../query'

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString() + 'n'
}

// todo: env config
const web3 = new Web3('https://acdc-gateway.audius.co/')
const DISCOVERY = 'https://discoveryprovider.audius.co'

const preClass = ``
const classes = {
  chip: `flex items-center bg-white overflow-hidden rounded-full border p-2 pr-4 gap-2 block`,
}

export function TxDetail() {
  const params = useParams()

  const { data } = useQuery([params.tx!], async () => {
    const receipt = await web3.eth.getTransactionReceipt(params.tx!)
    const logsDecoded = AudiusABIDecoder.decodeLogs(
      'EntityManager',
      receipt.logs as any
    )
    return { receipt, logsDecoded }
  })

  if (!data) return <div>loading</div>
  const { receipt, logsDecoded } = data

  const em = abiParamsToObject(logsDecoded[0].events)

  const metadata = em._metadata ? JSON.parse(em._metadata) : undefined

  return (
    <div className="nice">
      <Link to="/explorer" className="block my-4 font-extrabold">
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
          {JSON.stringify(logsDecoded, undefined, 2)}
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
        {signer && signer != user.wallet && (
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
  //https://discoveryprovider.audius.co/tracks?id=1
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

  if (!cid) {
    // fallback
    return <div style={styleProps} />
  }

  // const host =
  //   process.env.REACT_APP_ENVIRONMENT === 'staging'
  //     ? 'https://creatornode12.staging.audius.co'
  //     : 'https://creatornode2.audius.co'

  const host = 'https://creatornode2.audius.co'

  return <img src={`${host}/content/${cid}/150x150.jpg`} style={styleProps} />
}
