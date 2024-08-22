import { ID } from '~/models'

export type SDKRequest<T> = Omit<
  T,
  'encodedDataMessage' | 'encodedDataSignature'
> & { currentUserId?: ID | null }
