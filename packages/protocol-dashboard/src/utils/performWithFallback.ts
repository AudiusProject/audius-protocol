/**
 * Tries to run `work`, falls back to `fallback` if `work` throws.
 *
 * @param work
 * @param fallback
 */
export const performWithFallback = async <T>(
  work: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> => {
  try {
    const res = await work()
    return res
  } catch (e) {
    console.error(`Call failed, falling back. ${e.message}`)
  }

  try {
    const fall = await fallback()
    return fall
  } catch (e) {
    console.error(`Fallback failed ${e.message}`)
    throw e
  }
}
