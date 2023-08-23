/**
 * SEO Utlity functions to generate titles and descriptions
 */

import { fullCollectionPage, fullProfilePage, fullTrackPage } from './route'

export const createSeoDescription = (msg: string, userPage?: boolean) => {
  if (userPage)
    return `${msg} | Listen and stream tracks, albums, and playlists from your favorite artists on desktop and mobile`
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
    `Play ${userName} on Audius and discover followers on Audius`,
    true
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
  isAlbum,
  permalink
}: {
  playlistName?: string
  playlistId?: number
  userName?: string
  userHandle?: string
  isAlbum?: boolean
  permalink?: string
}) => {
  if (!playlistName || !playlistId || !userName || !userHandle) return {}

  const pageTitle = `${playlistName} by ${userName}`
  const pageDescription = createSeoDescription(
    `Listen to ${playlistName} ${
      isAlbum ? 'an album' : 'a playlist curated'
    } by ${userName} on Audius`
  )
  const canonicalUrl = fullCollectionPage(
    userHandle,
    playlistName,
    playlistId,
    permalink,
    isAlbum
  )
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
