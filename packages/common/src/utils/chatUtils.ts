import {
  ChatBlastAudience,
  ChatMessage,
  Track,
  Playlist,
  User,
  ChatPermission
} from '@audius/sdk'
import { mapValues } from 'lodash'

import { Status } from '~/models/Status'
import { InboxSettingsFormValues } from '~/store'

import { MESSAGE_GROUP_THRESHOLD_MINUTES } from './constants'
import dayjs from './dayjs'

export const CHAT_BLOG_POST_URL =
  'http://support.audius.co/help/How-to-Send-Messages-on-Audius'

const messages = {
  blastTitleFollowers: 'All Followers',
  blastTitleSupporters: 'Tip Supporters',
  blastTitleCustomers: 'Purchasers',
  blastTitleRemixers: 'Remix Creators',
  blastTitleCustomers2: 'All Purchasers',
  blastTitleRemixers2: 'Remixed',
  blastFollowersDescription: 'Everyone who follows you.',
  blastSupportersDescription: 'Everyone who has sent you a tip.',
  blastCustomersDescription: 'Everyone who has paid for your content.',
  blastRemixersDescription: 'Everyone who has remixed your tracks.',
  blastCTABase: 'Send a message blast to ',
  blastCTAFollowers: 'each of your followers',
  blastCTASupporters: 'everyone who has sent you a tip',
  blastCTACustomers: (audienceContentId?: string) =>
    audienceContentId
      ? 'all purchasers'
      : 'everyone who has purchased your content',
  blastCTARemixers: (audienceContentId?: string) =>
    audienceContentId
      ? 'everyone who remixed this track'
      : 'everyone who has remixed your tracks'
}

/**
 * Checks to see if the message was sent within the time threshold for grouping it with the next message
 */
export const hasTail = (message: ChatMessage, newMessage?: ChatMessage) => {
  if (!newMessage) return true
  return (
    message.sender_user_id !== newMessage.sender_user_id ||
    dayjs(newMessage.created_at).diff(message.created_at, 'minutes') >=
      MESSAGE_GROUP_THRESHOLD_MINUTES
  )
}

/**
 * Checks if the current message:
 * - Is the first unread message
 * - Is by a different user than the current one
 * - Is not the very first message
 */
export const isEarliestUnread = ({
  unreadCount,
  lastReadAt,
  currentMessageIndex,
  messages,
  currentUserId
}: {
  unreadCount: number
  lastReadAt?: string
  currentMessageIndex: number
  messages: ChatMessage[]
  currentUserId: string | null
}) => {
  if (unreadCount === 0) {
    return false
  }
  const message = messages[currentMessageIndex]
  const prevMessage = messages[currentMessageIndex + 1]
  const isUnread = !lastReadAt || dayjs(message.created_at).isAfter(lastReadAt)
  const isPreviousMessageUnread =
    prevMessage &&
    (!lastReadAt || dayjs(prevMessage.created_at).isAfter(lastReadAt))
  const isAuthor = message.sender_user_id === currentUserId
  return isUnread && !!prevMessage && !isPreviousMessageUnread && !isAuthor
}

/**
 * Can only fetch more messages if it's not in a loading state and
 * there are previous messages to fetch
 */
export const chatCanFetchMoreMessages = (
  messagesStatus?: Status,
  prevCount?: number
) => {
  return !!messagesStatus && messagesStatus !== Status.LOADING && !!prevCount
}

/**
 * Matches audius links with a specific hostname in the provided text
 * @param text input text
 * @param hostname the hostname of the site, e.g. audius.co
 */
export const matchAudiusLinks = ({
  text,
  hostname
}: {
  text: string
  hostname: string
}) => {
  const linkRegex = new RegExp(
    `https://${hostname.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )}/[^/\\s]+(?:/[^/\\s]+)*(?=\\s|$)`,
    'g'
  )
  const matches: string[] = text.match(linkRegex) ?? []

  return {
    matches
  }
}

/**
 * Formats a track for human readability.
 * @param track
 * @returns string of "title - display name"
 */
export const formatTrackName = ({ track }: { track: Track }) => {
  return `${track.title} - ${track.user.name}`
}

/**
 * Formats a collection for human readability.
 * @param collection
 * @returns string of "playlist name - display name"
 */
export const formatCollectionName = ({
  collection
}: {
  collection: Playlist
}) => {
  return `${collection.playlistName} - ${collection.user.name}`
}

/**
 * Formats a user for human readability.
 * @param track
 * @returns string of "display name"
 */
export const formatUserName = ({ user }: { user: User }) => {
  return user.name
}

/**
 * Custom split function that splits on \n, removing empty results
 * and keeping the \n in the returned array.
 * - hello\nworld becomes ['hello', '\n', 'world']
 * - hello\n becomes ['hello', '\n']
 * @param s
 * @returns array of parts
 */
export const splitOnNewline = (s: string) => {
  return s.split(/(\n)/).filter(Boolean)
}

export const makeBlastChatId = ({
  audience,
  audienceContentType,
  audienceContentId
}: {
  audience: ChatBlastAudience
  audienceContentType?: 'track' | 'album'
  audienceContentId?: string
}) => {
  return (
    `${audience}` +
    (audienceContentType ? `:${audienceContentType}` : '') +
    (audienceContentId ? `:${audienceContentId}` : '')
  )
}

export const getChatBlastTitle = (audience: ChatBlastAudience) => {
  switch (audience) {
    case ChatBlastAudience.FOLLOWERS:
      return messages.blastTitleFollowers
    case ChatBlastAudience.TIPPERS:
      return messages.blastTitleSupporters
    case ChatBlastAudience.CUSTOMERS:
      return messages.blastTitleCustomers
    case ChatBlastAudience.REMIXERS:
      return messages.blastTitleRemixers
  }
}

export const getChatBlastSecondaryTitle = ({
  audience,
  audienceContentId
}: {
  audience: ChatBlastAudience
  audienceContentId: string | undefined
}) => {
  switch (audience) {
    case ChatBlastAudience.FOLLOWERS:
      return messages.blastTitleFollowers
    case ChatBlastAudience.TIPPERS:
      return messages.blastTitleSupporters
    case ChatBlastAudience.CUSTOMERS:
      return audienceContentId
        ? messages.blastTitleCustomers
        : messages.blastTitleCustomers2
    case ChatBlastAudience.REMIXERS:
      return audienceContentId
        ? messages.blastTitleRemixers2
        : messages.blastTitleRemixers
  }
}

export const getChatBlastAudienceDescription = ({
  audience
}: {
  audience: ChatBlastAudience
}) => {
  switch (audience) {
    case ChatBlastAudience.FOLLOWERS:
      return messages.blastFollowersDescription
    case ChatBlastAudience.TIPPERS:
      return messages.blastSupportersDescription
    case ChatBlastAudience.CUSTOMERS:
      return messages.blastCustomersDescription
    case ChatBlastAudience.REMIXERS:
      return messages.blastRemixersDescription
  }
}

export const getChatBlastCTA = ({
  audience,
  audienceContentId
}: {
  audience: ChatBlastAudience
  audienceContentId: string | undefined
}) => {
  switch (audience) {
    case ChatBlastAudience.FOLLOWERS:
      return messages.blastCTABase + messages.blastCTAFollowers
    case ChatBlastAudience.TIPPERS:
      return messages.blastCTABase + messages.blastCTASupporters
    case ChatBlastAudience.CUSTOMERS:
      return (
        messages.blastCTABase + messages.blastCTACustomers(audienceContentId)
      )
    case ChatBlastAudience.REMIXERS:
      return (
        messages.blastCTABase + messages.blastCTARemixers(audienceContentId)
      )
  }
}

export const defaultChatPermitMap: InboxSettingsFormValues = {
  [ChatPermission.ALL]: false,
  [ChatPermission.FOLLOWERS]: false,
  [ChatPermission.FOLLOWEES]: false,
  [ChatPermission.TIPPERS]: false,
  [ChatPermission.TIPPEES]: false,
  [ChatPermission.VERIFIED]: false
}

export const transformPermitListToMap = (
  permitList: ChatPermission[]
): InboxSettingsFormValues => {
  if (permitList.includes(ChatPermission.ALL)) {
    return mapValues(defaultChatPermitMap, () => true)
  }

  if (permitList.includes(ChatPermission.NONE)) {
    return { ...defaultChatPermitMap }
  }

  return permitList.reduce(
    (acc, permit) => {
      acc[permit as keyof InboxSettingsFormValues] = true
      return acc
    },
    { ...defaultChatPermitMap }
  )
}

export const transformMapToPermitList = (
  permitMap: InboxSettingsFormValues
): ChatPermission[] => {
  if (permitMap[ChatPermission.ALL]) {
    return [ChatPermission.ALL]
  }
  if (Object.values(permitMap).every((value) => !value)) {
    return [ChatPermission.NONE]
  }
  return Object.keys(permitMap).filter(
    (key) => permitMap[key as keyof InboxSettingsFormValues]
  ) as ChatPermission[]
}
