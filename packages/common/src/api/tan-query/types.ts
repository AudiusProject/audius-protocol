import { DefinedInitialDataOptions } from '@tanstack/react-query'

/**
 * Standard tan-query pass-thru options that we use
 */
export type QueryOptions = Pick<
  DefinedInitialDataOptions<any>,
  'staleTime' | 'enabled'
>
