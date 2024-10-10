/**
 * Extracts the path of a URL with query parameters. Platform agnostic.
 */
export const getPathFromUrl = (url: string) => {
  const pathRegex = /^([a-z]+:\/\/)?(?:www\.)?([^/]+)?(.*)$/

  const match = url.match(pathRegex)

  if (match?.[3]) {
    const path = match[3]
    return path
  } else {
    throw new Error(`Invalid URL, couldn't get path.`)
  }
}
