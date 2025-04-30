import { closeErrorPage } from 'store/errors/actions'

/**
 * Note: We're not adding a Window interface declaration here because
 * it's already defined in configureStore.ts and we want to use the
 * same type to avoid TypeScript errors.
 */

/**
 * This utility helps automatically close the "Something Wrong" error page
 * when Hot Module Replacement (HMR) updates the code.
 *
 * When HMR updates code that had errors, the error page may persist in the Redux state
 * even though the underlying issue is fixed. This handler detects HMR updates and
 * resets the error state.
 */
export const registerErrorHmrHandler = () => {
  if (import.meta.hot) {
    // Listen for successful HMR updates
    import.meta.hot.on('vite:afterUpdate', () => {
      // When any module is hot-updated, close the error page if it's open
      // This assumes that an HMR update likely fixed the error
      window.store.dispatch(closeErrorPage())
    })
  }
}
