import { UseInfiniteQueryResult } from '@tanstack/react-query'

/**
 *  Helper method for infinite queries
 *
 *  By default, react-query does not have any system that prevents you from spamming page load requests.
 *  It's a real footgun.
 * @param queryData
 * @returns
 */
export const loadNextPage = (queryData: UseInfiniteQueryResult) => () => {
  if (!queryData.isFetching && queryData.hasNextPage) {
    queryData.fetchNextPage()
  }
}
