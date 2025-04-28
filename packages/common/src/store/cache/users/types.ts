import { Cache, User, ID, Cacheable } from '../../../models'

export interface UsersCacheState extends Cache<User> {
  handles: { [handle: string]: ID }
}

export type BatchCachedUsers = Omit<Cacheable<User>, '_timestamp'>
