export const ALL_RESULTS_LIMIT = 12

export const urlSearchParamsToObject = (
  searchParams: URLSearchParams
): Record<string, string> =>
  [...searchParams.entries()].reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: value
    }),
    {}
  )
