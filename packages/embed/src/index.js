import Router from 'preact-router'

import './util/initWeb3'
import App from './components/app'
import {
  HASH_ID_ROUTE,
  ID_ROUTE,
  COLLECTIBLES_ROUTE,
  COLLECTIBLE_ID_ROUTE,
  COLLECTIBLES_DISCORD_ROUTE,
  COLLECTIBLE_ID_DISCORD_ROUTE,
  AUDIO_NFT_PLAYLIST_DISCORD_ROUTE,
  AUDIO_NFT_PLAYLIST_ROUTE
} from './routes'

import './index.css'

const Index = () => (
  <Router>
    <App path={AUDIO_NFT_PLAYLIST_ROUTE} type='collectibles' />
    <App path={AUDIO_NFT_PLAYLIST_DISCORD_ROUTE} type='collectibles' />
    <App path={COLLECTIBLES_ROUTE} type='collectibles' />
    <App path={COLLECTIBLE_ID_ROUTE} type='collectibles' />
    <App path={COLLECTIBLES_DISCORD_ROUTE} type='collectibles' />
    <App path={COLLECTIBLE_ID_DISCORD_ROUTE} type='collectibles' />

    <App path={ID_ROUTE} />
    <App path={HASH_ID_ROUTE} />

    <App default />
  </Router>
)

export default Index
