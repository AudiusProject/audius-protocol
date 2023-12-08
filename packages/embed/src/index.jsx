import React from 'react'

import { createRoot } from 'react-dom/client'
import { Route, Routes, BrowserRouter } from 'react-router-dom'

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

const Index = () => (
  <BrowserRouter>
    <Routes>
      <Route
        exact
        path={AUDIO_NFT_PLAYLIST_ROUTE}
        element={<App path={AUDIO_NFT_PLAYLIST_ROUTE} type='collectibles' />}
      />
      <Route
        exact
        path={AUDIO_NFT_PLAYLIST_DISCORD_ROUTE}
        element={
          <App path={AUDIO_NFT_PLAYLIST_DISCORD_ROUTE} type='collectibles' />
        }
      />
      <Route
        exact
        path={COLLECTIBLES_ROUTE}
        element={<App path={COLLECTIBLES_ROUTE} type='collectibles' />}
      />
      <Route
        exact
        path={COLLECTIBLE_ID_ROUTE}
        element={<App path={COLLECTIBLE_ID_ROUTE} type='collectibles' />}
      />
      <Route
        exact
        path={COLLECTIBLES_DISCORD_ROUTE}
        element={<App path={COLLECTIBLES_DISCORD_ROUTE} type='collectibles' />}
      />
      <Route
        exact
        path={COLLECTIBLE_ID_DISCORD_ROUTE}
        element={
          <App path={COLLECTIBLE_ID_DISCORD_ROUTE} type='collectibles' />
        }
      />

      <Route exact path={ID_ROUTE} element={<App path={ID_ROUTE} />} />
      <Route
        exact
        path={HASH_ID_ROUTE}
        element={<App path={HASH_ID_ROUTE} />}
      />
    </Routes>
  </BrowserRouter>
)

window.global ||= window

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Index />)
}
