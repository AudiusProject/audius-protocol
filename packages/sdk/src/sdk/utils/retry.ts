import retry from 'async-retry'

/**
 * Calls fn and then retries once after 500ms, again after 1500ms, and again after 4000ms
 */
export const retry3 = async <ReturnType>(
  fn: () => ReturnType,
  onRetry = (_err: any) => {}
): Promise<ReturnType> => {
  return await retry(fn, {
    minTimeout: 500,
    maxTimeout: 4000,
    factor: 3,
    retries: 3,
    onRetry
  })
}
