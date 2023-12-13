import { dialEs } from '../src/conn'
import { indexNames } from '../src/indexNames'

export async function nuke() {
  const es = dialEs()
  const indexes = Object.values(indexNames)
  console.log('deleting', indexes)
  await Promise.all(
    indexes.map((idx) => es.indices.delete({ index: idx }, { ignore: [404] }))
  )
  console.log('done')
}

nuke()
