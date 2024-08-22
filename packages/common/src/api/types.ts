import { ID } from '~/models'

/** Helper type for accepting args to a SDK method. It strips out the signature
 * parameters (which are passed by SDK middleware) and adds the common
 * `currentUserId` parameter that most functions calling SDK methods will convert
 * and pass along. */
export type SDKRequest<T> = Omit<
  T,
  'encodedDataMessage' | 'encodedDataSignature'
> & { currentUserId?: ID | null }
