import { z } from 'zod'
import { decodeHashId } from '../utils/hashId'

export const HashId = z.string().transform<number>((data: string) => {
  const id = decodeHashId(data)
  if (id === null) {
    throw new Error('id is not valid')
  }
  return id
})
