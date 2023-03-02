import type { EndpointToMd5 } from '../../api'
import { useFilesInShard } from '../../api'
import { shortenUrl } from '../../util'
import type { ErrorRow } from './ErrorRow'
import FilesTable from './FilesTable'
import type { HealthyRow } from './HealthyRow'

export default function FilesTableWrapper({
  shard,
  hostsWithShard,
  highlightJobId,
  highlightFileName,
}: {
  shard: string
  hostsWithShard: string[]
  highlightJobId?: string
  highlightFileName?: string
}) {
  const fileQueries = useFilesInShard(shard, hostsWithShard)
  const errors = fileQueries.filter((query) => query.error)
  if (fileQueries.filter((query) => query.isLoading).length) return <>Loading...</>

  // Group files from each node by file key
  type Files = {
    [fileKey: string]: EndpointToMd5
  }
  const files: Files = {}
  for (const { data } of fileQueries) {
    if (!data) continue
    for (const { key, md5 } of data.files) {
      if (!files[key]) files[key] = {}
      files[key][data.storageHost] = md5
    }
  }

  // Separate files into display rows for healthy and error
  const healthyRows: HealthyRow[] = []
  const errorRows: ErrorRow[] = []
  for (const fileKey of Object.keys(files)) {
    const fileName = fileKey.substring(fileKey.indexOf('/') + 1)
    const jobId = fileName.substring(0, fileName.indexOf('_'))
    const nodeLinks = hostsWithShard.map((host) => {
      return {
        href: `${host}/storage/api/v1/persistent/file/${fileKey}`,
        display: `${files[fileKey][host] ? '' : '(MISSING) '}${shortenUrl(host)}/...`,
      }
    })
    const highlight = highlightJobId === jobId || highlightFileName === fileName
    console.log(highlightJobId, jobId)

    const nodeToMd5 = files[fileKey]
    const numNodes = Object.keys(nodeToMd5).length
    const expectedNumNodes = hostsWithShard.length

    if (numNodes < expectedNumNodes) {
      // Error case: file not replicated to all nodes
      errorRows.push({
        fileName,
        nodeLinks,
        md5s: nodeToMd5,
        job: {
          href: `${hostsWithShard[0]}/storage/api/v1/job-results/${jobId}`,
          display: jobId,
        },
        error: 'NOT_REPLICATED',
        highlight,
      })
    } else {
      // Error case: md5 mismatch
      const md5s = Object.values(nodeToMd5)
      const firstMd5 = md5s[0]
      const md5sMatch = md5s.every((md5) => md5 === firstMd5)
      if (md5sMatch) {
        // Healthy case: md5s match on all nodes
        healthyRows.push({
          fileName,
          nodeLinks,
          md5: nodeToMd5[hostsWithShard[0]],
          job: {
            href: `${hostsWithShard[0]}/storage/api/v1/job-results/${jobId}`,
            display: jobId,
          },
          highlight,
        })
      } else {
        errorRows.push({
          fileName,
          nodeLinks,
          md5s: nodeToMd5,
          job: {
            href: `${hostsWithShard[0]}/storage/api/v1/job-results/${jobId}`,
            display: jobId,
          },
          error: 'MD5_MISMATCH',
          highlight,
        })
      }
    }

    delete files[fileKey]
  }

  return (
    <div>
      {errors.length > 0 && <>Some nodes encountered an error while fetching:</>}
      {errors.length > 0 &&
        errors.map(({ error }, i) => <div key={i}>{JSON.stringify(error)}</div>)}
      <FilesTable errorRows={errorRows} healthyRows={healthyRows} />
    </div>
  )
}
