import fs from 'fs-extra'
import os from 'os'
import path from 'path'

export async function useTempDir(
  fn: (folder: string) => void | Promise<void>,
  mode?: string | number
) {
  const folder = path.join(
    os.tmpdir(),
    'create-audius-app-test-' + Math.random().toString(36).slice(2)
  )
  await fs.mkdirp(folder)

  if (mode) {
    await fs.chmod(folder, mode)
  }

  try {
    await fn(folder)
  } finally {
    await fs.remove(folder)
  }
}
