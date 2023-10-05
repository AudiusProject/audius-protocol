import { useSelector } from 'react-redux'
import { AppState } from 'store/types'

// -------------------------------- Selectors --------------------------------
export const getPageTitle = (state: AppState) => state.pageHistory.pageTitles

// -------------------------------- Hooks --------------------------------
export const useLastPage = () => {
  const pageTitles = useSelector(getPageTitle)
  if (pageTitles.length > 1) return pageTitles[pageTitles.length - 2]
  return null
}
