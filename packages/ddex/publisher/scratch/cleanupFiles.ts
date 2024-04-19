import { readdir, rm } from 'fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'path'

export async function cleanupFiles() {
  let dirs = await readdir(tmpdir(), { recursive: false })
  const work = dirs
    .filter((dir) => dir.includes('ddex-'))
    .map((dir) => {
      dir = join(tmpdir(), dir)
      console.log('removing', dir)
      return rm(dir, { recursive: true })
    })
  await Promise.all(work)
}
