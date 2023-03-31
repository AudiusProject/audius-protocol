import { Cache, User, ID } from '../../../models'

export interface UsersCacheState extends Cache<User> {
  handles: { [handle: string]: ID }
}
