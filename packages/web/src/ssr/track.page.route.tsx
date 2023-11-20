import { resolveRoute } from 'vike/routing'
import { PageContextServer } from 'vike/types'

export default (pageContext: PageContextServer) => {
  if (pageContext.urlPathname.match(/index\.css\.map$/)) {
    return false
  }
  return resolveRoute('/@handle/@slug', pageContext.urlPathname)
}
