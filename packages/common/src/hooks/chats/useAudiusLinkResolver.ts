import { useCallback, useEffect, useRef, useState } from 'react'

import {
  AudiusSdk,
  instanceOfPlaylist,
  instanceOfTrack,
  Playlist,
  ResolveApi,
  Track,
  User
} from '@audius/sdk'

import { ID } from '~/models'
import {
  decodeHashId,
  formatCollectionName,
  formatTrackName,
  formatUserName,
  matchAudiusLinks,
  Nullable
} from '~/utils'

const {
  instanceOfTrackResponse,
  instanceOfPlaylistResponse,
  instanceOfUserResponse
} = ResolveApi

/**
 * Hook to use within chat composition interfaces.
 * It pulls Audius links out into display text
 * @param value chat input text, e.g. what's in the text area
 * @param hostname audius hostname for this instance, e.g. audius.co
 * @param audiusSdk sdk instantiation interface
 * @returns {Object} Object containing helper methods and state:
 * - trackId: The ID of the first track resolved (or null if none found).
 *
 * - collectionId: The ID of the first collection resolved (or null if none found).
 *
 * - resolveLinks: Async function that takes the input text and
 *     replaces Audius links with their human-readable counterparts.
 *
 * - restoreLinks: Function that restores human-readable text back into Audius
 *      links in the provided value. This should be used before text submission.
 *
 * - getMatches: Function that returns a generator of matches for resolved
 *      Audius links within the provided value. This is useful when displaying text
 *      back to the user.
 *
 * - handleBackspace: Function that checks if the user backspaced over a resolved link
 *      and modifies the text accordingly, deleting the whole display text/link on a
 *      single keystroke.
 *
 * - clearLinks: Function that resets the `trackId` and `collectionId` state to null.
 *      Call this method when submitting.
 *
 * @example
 * const Input = () => {
 *   const [value, setValue] = useState('')
 *   const { resolveLinks, restoreLinks, clearLinks } = useAudiusLinkResolver({
 *     "Check out this song: https://audius.co/artist/track",
 *     "audius.co",
 *     audiusSdk
 *   })
 *
 *   useEffect(() => {
 *     const fn = async () => {
 *       setValue(await resolveLinks(value))
 *     }
 *     fn()
 *   }, [value, setValue])
 *
 *   const onSubmit = (value: string) => {
 *     const restored = restoreLinks(value)
 *     submit(restored)
 *     clearLinks()
 *   }
 *   return <textarea value={value} onSubmit={onSubmit} />
 * }
 */
export const useAudiusLinkResolver = ({
  value,
  hostname,
  audiusSdk
}: {
  value: string
  hostname: string
  audiusSdk: () => Promise<AudiusSdk>
}) => {
  // Maintain bidirectional maps of audius links to human readable format
  const linkToHuman = useRef<{ [key: string]: string }>({}).current
  const humanToData = useRef<{
    [key: string]: { link: string; data: Track | Playlist | User }
  }>({}).current

  // The track id used to render the composer preview
  const [trackId, setTrackId] = useState<Nullable<ID>>(null)
  // The collection id used to render the composer preview
  const [collectionId, setCollectionId] = useState<Nullable<ID>>(null)

  /**
   * Resolves Audius links in the provided text to their display text equivalent.
   */
  const resolveLinks = useCallback(
    async (value: string) => {
      const sdk = await audiusSdk()
      const { matches } = matchAudiusLinks({
        text: value,
        hostname
      })

      for (const match of matches) {
        if (!(match in linkToHuman)) {
          const res = await sdk.resolve({ url: match })
          if (res.data) {
            if (instanceOfTrackResponse(res)) {
              const human = formatTrackName({ track: res.data })
              linkToHuman[match] = human
              humanToData[human] = { link: match, data: res.data }
            } else if (instanceOfPlaylistResponse(res)) {
              const human = formatCollectionName({ collection: res.data[0] })
              linkToHuman[match] = human
              humanToData[human] = { link: match, data: res.data[0] }
            } else if (instanceOfUserResponse(res)) {
              const human = formatUserName({ user: res.data })
              linkToHuman[match] = human
              humanToData[human] = { link: match, data: res.data }
            }
          }
        } else {
          // If we already loaded the track, delay showing by 500ms
          // to give the user some sense of what is happening.
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      // Sort here to make sure that we replace all content before
      // replacing their substrings.
      // This is because in link replacement, we want to replace
      // https://artist/track
      // before we replace
      // https://artist
      // to make sure that we don't accidentally replace the substring
      // and then fail to match the larger string
      let editedValue = value
      for (const [link, human] of Object.entries(linkToHuman).sort(
        (a, b) => b[0].length - a[0].length
      )) {
        editedValue = editedValue.replaceAll(link, human)
      }

      return editedValue
    },
    [linkToHuman, humanToData, hostname, audiusSdk]
  )

  /**
   * Restores display text with the original Audius links.
   * Should be called before form submission.
   */
  const restoreLinks = useCallback(
    (value: string) => {
      let editedValue = value
      for (const [human, { link }] of Object.entries(humanToData)) {
        editedValue = editedValue.replaceAll(human, link)
      }
      return editedValue
    },
    [humanToData]
  )

  const handleBackspace = useCallback(
    ({
      cursorPosition,
      textBeforeCursor
    }: {
      cursorPosition: number
      textBeforeCursor: string
    }) => {
      const matched = Object.keys(humanToData).find((i) =>
        textBeforeCursor.endsWith(i)
      )
      if (matched) {
        return (value: string) =>
          value.slice(0, cursorPosition - matched.length) +
          value.slice(cursorPosition)
      }
      return null
    },
    [humanToData]
  )

  const getMatches = useCallback(
    (value: string) => {
      const regexString = Object.keys(humanToData).join('|')
      const regex = regexString ? new RegExp(regexString, 'gi') : null
      if (regex) {
        return value.matchAll(regex)
      }
      return null
    },
    [humanToData]
  )

  /**
   * Resets any found track id / collection id
   */
  const clearLinks = useCallback(() => {
    setTrackId(null)
    setCollectionId(null)
  }, [setTrackId, setCollectionId])

  /**
   * Updates the track id and/or collection id state if found in matching text
   */
  useEffect(() => {
    for (const [human, { data }] of Object.entries(humanToData)) {
      if (value.includes(human)) {
        if (instanceOfTrack(data)) {
          setTrackId(decodeHashId(data.id))
        } else if (instanceOfPlaylist(data)) {
          setCollectionId(decodeHashId(data.id))
        }
        return
      }
    }
    setTrackId(null)
    setCollectionId(null)
  }, [trackId, humanToData, value])

  return {
    trackId,
    collectionId,
    resolveLinks,
    restoreLinks,
    getMatches,
    handleBackspace,
    clearLinks
  }
}
