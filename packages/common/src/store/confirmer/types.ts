type Confirmable = {
  index: number
  calls: Call[]
}

export type ConfirmationOptions = {
  /** String id to group together squashable or parallelizable calls. */
  operationId?: string

  /** Whether the call can be cancelled if another call
   * with the same operation ID is made later.
   */
  squashable?: boolean

  /** Whether the call can be parallelized with other calls
   * of the same operation ID.
   */
  parallelizable?: boolean

  /** Whether to call the success callback of only the *last* call that resolves with same operation ID
   * (and cancel all earlier success callbacks from calls with that operation ID). */
  useOnlyLastSuccessCall?: boolean
}

type Call = {
  call: any
  result: any
  cancelled?: boolean
} & ConfirmationOptions

export interface ConfirmerState {
  confirm: { [key: string]: Confirmable }
  complete: { [key: string]: any[] }
  /** A helper mapping used if `useLastSuccessCall` is true for any calls sharing an operation ID
   *
   * { [uid] : { [operationId] }: index of latest success call added for that operation id in the `complete` map } */
  operationSuccessCallIdx: { [key: string]: { [key: string]: number } }
}

export type RequestConfirmationError = {
  message: string
  error: Error
  timeout: boolean
}
