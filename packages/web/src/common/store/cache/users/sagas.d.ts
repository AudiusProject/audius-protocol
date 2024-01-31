import { User } from '@audius/common/models'

export declare function* adjustUserField(config: {
  user: User
  fieldName: string
  delta: number
}): void

export declare function* fetchUsers(
  userIds: (string | number | null)[],
  requiredFields?: Set<string>,
  forceRetrieveFromSource?: boolean
): { entries: Record<string, User> }

export declare function* fetchUserByHandle(handle: string): User | undefined

export default function sagas(): (() => Generator<
  ForkEffect<never>,
  void,
  unknown
>)[]
