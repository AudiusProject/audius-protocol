import { encodeHashId } from './hashId'

// Copied from:
// https://github.com/AudiusProject/audius-protocol/blob/main/packages/common/src/store/pages/chat/utils.ts
export const makeChatId = (userIds: number[]) => {
  return userIds.map(encodeHashId).sort().join(':')
}
