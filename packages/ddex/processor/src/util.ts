import * as fs from 'fs/promises'
import { join } from 'path'
import { parseDdexXml } from './parseDelivery'
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
  exampleFileName: string,
  userName: string
) {
  const tempDir = `/tmp/ddex_simulate/${new Date().toISOString()}`
  await fs.rm(tempDir, { recursive: true, force: true })
  await fs.mkdir(tempDir, { recursive: true })
  await fs.cp('./fixtures', tempDir, { recursive: true })

  const xmlPath = join(tempDir, exampleFileName)
  let contents = await fs.readFile(xmlPath, 'utf8')

  contents = contents.replaceAll(
    '<FullName>DJ Theo</FullName>',
    `<FullName>${userName}</FullName>`
  )

  contents = contents.replaceAll(
    '<GRid>A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0</GRid>',
    `<GRid>A_${Date.now()}</GRid>`
  )

  const releases = parseDdexXml(source.name, xmlPath, contents)
  console.log('simulated releases', releases)

  setTimeout(
    () => {
      console.log('cleaning up', tempDir)
      fs.rm(tempDir, { recursive: true, force: true })
    },
    // should wait at least as long as polling interval
    1000 * 60 * 30
  )
}
