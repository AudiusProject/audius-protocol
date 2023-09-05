/**
 * SEO Utlity functions to generate titles and descriptions
 */

import {
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  fullTrackPage
} from './route'

export const createSeoDescription = (msg: string) => {
  return `${msg} | Stream tracks, albums, playlists on desktop and mobile`
}

export const getUserPageSEOFields = ({
  handle,
  userName,
  bio
}: {
  handle: string
  userName: string
  bio: string
}) => {
  const pageTitle = userName
  const pageDescription = createSeoDescription(
    `Play ${userName} on Audius and discover followers on Audius`
  )
  const canonicalUrl = fullProfilePage(handle)
  const structuredData = {
    '@context': 'http://schema.googleapis.com/',
    '@type': 'MusicGroup',
    '@id': canonicalUrl,
    datePublished: null,
    url: canonicalUrl,
    name: userName,
    description: bio || pageDescription,
    potentialAction: {
      '@type': 'ListenAction',
      target: [
        {
          '@type': 'EntryPoint',
          urlTemplate: canonicalUrl
        }
      ],
      expectsAcceptanceOf: {
        '@type': 'Offer',
        category: 'free',
        eligibleRegion: []
      }
    }
  }

  return {
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    structuredData
  }
}

export const getTrackPageSEOFields = ({
  title,
  userName,
  permalink,
  releaseDate
}: {
  title?: string
  userName?: string
  permalink?: string
  releaseDate?: string
}) => {
  if (!title || !userName || !permalink) return {}
  const pageTitle = `${title} by ${userName}`
  const pageDescription = `Stream ${title} by ${userName} on Audius | Stream similar artists to ${userName} on desktop and mobile`
  const canonicalUrl = fullTrackPage(permalink)
  const structuredData = {
    '@context': 'http://schema.googleapis.com/',
    '@type': 'MusicRecording',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: title,
    description: pageDescription,
    datePublished: releaseDate || null,
    potentialAction: {
      '@type': 'ListenAction',
      target: [
        {
          '@type': 'EntryPoint',
          urlTemplate: canonicalUrl
        }
      ],
      expectsAcceptanceOf: {
        '@type': 'Offer',
        category: 'free',
        eligibleRegion: []
      }
    }
  }

  return {
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    structuredData
  }
}

export const getCollectionPageSEOFields = ({
  playlistName,
  playlistId,
  userName,
  userHandle,
  isAlbum
}: {
  playlistName?: string
  playlistId?: number
  userName?: string
  userHandle?: string
  isAlbum?: boolean
}) => {
  if (!playlistName || !playlistId || !userName || !userHandle) return {}

  const pageTitle = `${playlistName} by ${userName}`
  const pageDescription = createSeoDescription(
    `Listen to ${playlistName} by ${userName} on Audius`
  )
  const canonicalUrl = isAlbum
    ? fullAlbumPage(userHandle, playlistName, playlistId)
    : fullPlaylistPage(userHandle, playlistName, playlistId)
  const structuredData = {
    '@context': 'http://schema.googleapis.com/',
    '@type': 'MusicAlbum',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: playlistName,
    description: pageDescription,
    potentialAction: {
      '@type': 'ListenAction',
      target: [
        {
          '@type': 'EntryPoint',
          urlTemplate: canonicalUrl
        }
      ],
      expectsAcceptanceOf: {
        '@type': 'Offer',
        category: 'free',
        eligibleRegion: []
      }
    }
  }

  return {
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    structuredData
  }
}
