import { makePageRoute } from 'ssr/util'

export default makePageRoute(
  [
    '/@handle',
    '/@handle/tracks',
    '/@handle/albums',
    '/@handle/playlists',
    '/@handle/reposts',
    '/@handle/collectibles'
  ],
  'Profile Page'
)
