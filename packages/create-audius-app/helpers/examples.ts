/* eslint-disable import/no-extraneous-dependencies */
import tar from 'tar'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

export type RepoInfo = {
  username: string
  name: string
  branch: string
  filePath: string
}

export async function isUrlOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.status === 200
  } catch {
    return false
  }
}

export function existsInRepo(nameOrUrl: string): Promise<boolean> {
  try {
    const url = new URL(nameOrUrl)
    return isUrlOk(url.href)
  } catch {
    return isUrlOk(
      `https://api.github.com/repos/AudiusProject/audius-protocol/contents/packages/libs/src/sdk/examples/${encodeURIComponent(
        nameOrUrl
      )}`
    )
  }
}

async function downloadTarStream(url: string) {
  const res = await fetch(url)

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`)
  }

  return Readable.fromWeb(res.body as import('stream/web').ReadableStream)
}

export async function downloadAndExtractExample(root: string, name: string) {
  await pipeline(
    await downloadTarStream(
      'https://codeload.github.com/AudiusProject/audius-protocol/tar.gz/main'
    ),
    tar.x({
      cwd: root,
      // Number of levels to strip from the root of the archive,
      // i.e. how deeply nested are the examples
      strip: 7,
      filter: (p) => {
        return p.includes(
          `audius-protocol-main/packages/libs/src/sdk/examples/${name}/`
        )
      }
    })
  )
}
