import { followsEtl } from './followsEtl'
import { Job, JobOptions, BlocknumberCheckpoint } from './job'
import { getBlocknumberCheckpoints, runJob } from './jobRunner'
import { playlistEtl } from './playlistEtl'
import { playsEtl } from './playsEtl'
import { repostEtl } from './repostEtl'
import { savesEtl } from './savesEtl'
import { trackEtl } from './trackEtl'
import { userEtl } from './userEtl'

const defaultOptions = {
  jobs: 'users,tracks,playlists,reposts,saves',
}

export const jobTable: Record<string, Job> = {
  follows: followsEtl,
  playlists: playlistEtl,
  plays: playsEtl,
  reposts: repostEtl,
  saves: savesEtl,
  tracks: trackEtl,
  users: userEtl,
}

export async function runEtl(options: JobOptions = defaultOptions) {
  console.log('etl', options)
  if (!options.jobs) throw new Error('no jobs')
  const jobs = options.jobs?.split(',').map((j: string) => {
    if (!jobTable[j]) {
      throw new Error(`unknown job: ${j}`)
    }
    return jobTable[j]
  })

  // take the checkpoint at the beginning to ensure a consistent world view before we start
  const checkpoints = await getBlocknumberCheckpoints()
  if (options.drop) {
    for (let key in checkpoints) {
      checkpoints[key as keyof BlocknumberCheckpoint] = 0
    }
  }

  const work = jobs.map((j) => runJob(j, options, checkpoints))
  await Promise.all(work)
}
