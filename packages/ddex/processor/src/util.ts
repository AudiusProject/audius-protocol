import decompress from 'decompress'
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { processDeliveryDir } from './parseDelivery'
import { SourceConfig } from './sources'

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function parseBool(b: string | undefined): boolean {
  if (!b) return false
  b = b.toLowerCase().trim()
  return b != '' && b != '0' && b != 'false'
}

export function omitEmpty(obj: any) {
  const entries = Object.entries(obj).filter(([, v]) => Boolean(v))
  return Object.fromEntries(entries)
}

export async function simulateDeliveryForUserName(
  source: SourceConfig,
  userName: string
) {
  // unzip to tempDir
  const tempDir = `/tmp/ddex_simulate/${new Date().toISOString()}`
  await rm(tempDir, { recursive: true, force: true })
  await mkdir(tempDir, { recursive: true })

  await decompress(
    '../ingester/e2e_test/fixtures/batch/ern382/1_CPD1.zip',
    tempDir
  )

  // change name
  const files = await readdir(tempDir, { recursive: true })

  const work = files
    .filter((f) => f.toLowerCase().endsWith('.xml'))
    .map((f) => join(tempDir, f))
    .map(async (filePath: string) => {
      let contents = await readFile(filePath, 'utf8')
      contents = contents.replaceAll(
        '<FullName>Monkey Claw</FullName>',
        `<FullName>${userName}</FullName>`
      )

      contents = contents.replaceAll(
        '<ICPN>721620118165</ICPN>',
        `<ICPN>A_${Date.now()}</ICPN>`
      )
      contents = contents.replaceAll(
        '<ISRC>CASE00000001</ISRC>',
        `<ISRC>T1_${Date.now()}</ISRC>`
      )
      contents = contents.replaceAll(
        '<ISRC>CASE00000002</ISRC>',
        `<ISRC>T2_${Date.now()}</ISRC>`
      )
      await writeFile(filePath, contents, 'utf8')
    })

  await Promise.all(work)

  await processDeliveryDir(source.name, tempDir)

  // we do want to cleanup tempDir
  // put publisher needs to get assets (images, sounds)
  // so we'll have to add a background job to do cleanup
}
