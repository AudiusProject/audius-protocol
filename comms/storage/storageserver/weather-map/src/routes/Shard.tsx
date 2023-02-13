import { useParams, useSearchParams } from 'react-router-dom'
import seedrandom from 'seedrandom'

import { HostAndShards, useNodesToShards } from '../api'
import type { ErrorRow } from '../components/filesTable/ErrorRow'
import FilesTable from '../components/filesTable/FilesTable'
import FilesTableWrapper from '../components/filesTable/FilesTableWrapper'
import type { HealthyRow } from '../components/filesTable/HealthyRow'
import Nodes from '../components/nodes/Nodes'

function makeRandJobId(arng: seedrandom.PRNG) {
  let res = ''
  const base36 = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 25; i++) {
    res += base36.charAt(Math.floor(arng() * 36))
  }
  return res
}

export default function Shard() {
  const { isLoading, error, data: hostsAndShards } = useNodesToShards()
  const { shard } = useParams()
  const [searchParams] = useSearchParams()

  let jobId = ''
  let fileName = ''
  for (const [key, val] of searchParams.entries()) {
    if (key === 'jobID') jobId = val
    else if (key === 'fileName') fileName = val
  }

  if (isLoading) return <>Loading...</>
  if (error) return <>An error has occurred: ${JSON.stringify(error)}</>
  if (!hostsAndShards) return <>Unable to query any nodes in network</>
  if (!shard) return <>No shard specified in path param</>

  const hostsAndShardsFilteredToThisShard = Object.fromEntries(
    Object.entries(hostsAndShards).filter(([, { shards }]) => shards.includes(shard)),
  )

  if (shard === 'DEMO') {
    const errorRows: ErrorRow[] = [
      {
        fileName: '0123456789.mp3',
        nodeLinks: [
          { href: '/node1', display: 'node1.com' },
          { href: '/node2', display: '(MISSING) node2.com' },
          { href: '/node3', display: '(MISSING) node3.com' },
        ],
        md5s: { node1: 'e8da3b3649dc7ac4cf7ff0da82f3ada8' },
        job: {
          href: 'http://node1.com/storage/job-result/0123456789',
          display: '0123456789',
        },
        error: 'NOT_REPLICATED',
        highlight: jobId === '0123456789' || fileName === '0123456789.mp3',
      },
      {
        fileName: 'abcdefghijklmnop_150.jpg',
        nodeLinks: [
          { href: '/node1', display: 'node1.com' },
          { href: '/node2', display: 'node2.com' },
          { href: '/node3', display: 'node3.com' },
        ],
        md5s: {
          node1: 'e8da3b3649dc7ac4cf7ff0da82f3ada8',
          node2: 'e8da3b3649dc7ac4cf7ff0da82f3ada8',
          node3: 'd834c021ee616be543be6b0b87ffd8e1',
        },
        job: {
          href: 'http://node1.com/storage/job-result/abcdefghijklmnop',
          display: 'abcdefghijklmnop',
        },
        error: 'MD5_MISMATCH',
        highlight:
          jobId === 'abcdefghijklmnop' || fileName === 'abcdefghijklmnop_150.jpg',
      },
    ]
    const healthyRows: HealthyRow[] = []
    // Generate random fileNames for healthy rows (use the same RNG seed so we can refresh and see the same rows)
    const arng = seedrandom.alea('DEMO')
    for (let i = 0; i < 10; i++) {
      const randJobId = makeRandJobId(arng)
      for (const ext of ['_150.jpg', '_480.jpg', '_1000.jpg']) {
        healthyRows.push({
          fileName: randJobId + ext,
          nodeLinks: [
            { href: '/node1', display: 'node1.com' },
            { href: '/node2', display: 'node2.com' },
            { href: '/node3', display: 'node3.com' },
          ],
          md5: makeRandJobId(arng),
          job: {
            href: 'http://node1.com/storage/job-result/' + randJobId,
            display: randJobId,
          },
          highlight: jobId === randJobId || fileName === randJobId + ext,
        })
      }
    }
    const demoHostsAndShards: {
      [pubKey: string]: HostAndShards
    } = {}
    demoHostsAndShards['0x1234567890'] = {
      host: `http://node1.com`,
      shards: ['aa', 'DEMO', '8f'],
    }
    demoHostsAndShards['0x1234567891'] = {
      host: `http://node2.com`,
      shards: ['DEMO', 'wi', 'z2'],
    }
    demoHostsAndShards['0x1234567892'] = {
      host: `http://node3.com`,
      shards: ['le', '3n', 'DEMO'],
    }
    return (
      <>
        <Nodes hostsAndShards={demoHostsAndShards} />
        <FilesTable errorRows={errorRows} healthyRows={healthyRows} />
      </>
    )
  }

  return (
    <>
      <Nodes hostsAndShards={hostsAndShardsFilteredToThisShard} />
      <FilesTableWrapper
        shard={shard}
        hostsWithShard={Object.keys(hostsAndShardsFilteredToThisShard).map((pubKey) => {
          return hostsAndShardsFilteredToThisShard[pubKey].host
        })}
        highlightJobId={jobId}
        highlightFileName={fileName}
      />
    </>
  )
}
