import { ID } from '~/models'

/** Helper type for accepting args to a SDK method. It strips out the signature
 * parameters (which are passed by SDK middleware) and adds the common
 * `currentUserId` parameter that most functions calling SDK methods will convert
 * and pass along. */
export type SDKRequest<T> = Omit<
  T,
  'encodedDataMessage' | 'encodedDataSignature'
> & { currentUserId?: ID | null }

/** Converts get params for an SDK method to a structure that can be used with
 * `useInfiniteQuery`. Specifically, removes `limit`, `offset`, auth headers,
 * and `userId` (which for SDK is a hashed string, while we want to use IDs
 * internally for query keys). It also adds the `pageSize` field, which all
 * infinite queries will need. */
export type SDKInfiniteQueryArgs<T> = Omit<
  T,
  'encodedDataMessage' | 'encodedDataSignature' | 'userId' | 'limit' | 'offset'
> & {
  pageSize?: number
}
