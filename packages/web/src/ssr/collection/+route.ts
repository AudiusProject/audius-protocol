import { makePageRoute } from 'ssr/util'

export default makePageRoute(
  ['/@handle/playlist/@slug', '/@handle/album/@slug'],
  'Collection Page'
)
