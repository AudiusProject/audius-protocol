import { ID } from '~/models/Identifiers'
import { encodeHashId } from '~/utils/hashIds'

export const makeChatId = (userIds: ID[]) => {
  return userIds.map(encodeHashId).sort().join(':')
}
