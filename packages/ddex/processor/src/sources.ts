import { readFileSync } from 'fs'

export type SourceConfig = {
  env?: 'production' | 'staging' | 'development'
  name: string
  ddexKey: string
  ddexSecret: string
  awsKey: string
  awsSecret: string
  awsRegion: string
  awsBucket: string
}

let sourceList: SourceConfig[] = []

export const sources = {
  load() {
    try {
      const j = readFileSync('./sources.json', 'utf8')
      const sourceConfig = JSON.parse(j) as {
        sources: SourceConfig[]
      }
      sourceList = sourceConfig.sources
      return sourceList
    } catch (e) {
      console.log('failed to load sources', e)
    }
  },

  all() {
    return sourceList
  },

  findByName(name: string) {
    const found = sourceList.find((s) => s.name == name)
    if (!found) throw new Error(`unable to find source for name: ${name}`)
    return found
  },

  findByXmlUrl(xmlUrl: string) {
    const u = new URL(xmlUrl)
    const found = sourceList.find((s) => s.awsBucket == u.host)
    if (!found) throw new Error(`unable to find source for name: ${name}`)
    return found
  },
}
