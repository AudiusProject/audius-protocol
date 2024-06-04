import { useCallback, useContext, useEffect } from 'react'

import { Status } from '@audius/common/models'
import { Flex, LoadingSpinner } from '@audius/harmony'
import { useParams } from 'react-router-dom'

import { useHistoryContext } from 'app/HistoryProvider'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  CenterPreset,
  LeftPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import Page from 'components/page/Page'
import { useMedia } from 'hooks/useMedia'

import { RecentSearches } from './RecentSearches'
import { SearchCatalogTile } from './SearchCatalogTile'
import { CategoryKey, SearchHeader } from './SearchHeader'

export const SearchPageV2 = () => {
  const { isMobile } = useMedia()

  const { category, query } = useParams<{
    category: CategoryKey
    query: string
  }>()
  const { history } = useHistoryContext()

  // Set nav header
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(CenterPreset.LOGO)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setCenter, setRight])

  const setCategory = useCallback(
    (category: CategoryKey) => {
      history.push(`/search/${query}/${category}`)
    },
    [history, query]
  )

  const header = (
    <SearchHeader
      query={query}
      title={'Search'}
      category={category as CategoryKey}
      setCategory={setCategory}
    />
  )

  const PageComponent = isMobile ? MobilePageContainer : Page

  return (
    <PageComponent
      title={query ?? 'Search'}
      description={`Search results for ${query}`}
      // canonicalUrl={fullSearchResultsPage(query)}
      header={header}
    >
      <Flex direction='column' w='100%'>
        {isMobile ? header : null}
        {!query ? (
          <Flex
            direction='column'
            alignItems='center'
            gap={isMobile ? 'xl' : 'l'}
          >
            <SearchCatalogTile />
            <RecentSearches />
          </Flex>
        ) : null}
        {status === Status.LOADING ? <LoadingSpinner /> : <div></div>}
      </Flex>
    </PageComponent>
  )
}
