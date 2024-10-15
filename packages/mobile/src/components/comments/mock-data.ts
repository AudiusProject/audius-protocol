import type { Comment, ReplyComment } from '@audius/sdk'

// These are all things that need to be added to the API spec.
// May change over time but good enough to stub UI out
type UnimplementedFeatures = {
  isLikedByCurrentUser?: boolean
  isLikedByArtist?: boolean
  notifsDisabledByCurrentUser?: boolean
}

type CommentWithUnimplementedFeatures = Comment &
  UnimplementedFeatures & { replies?: (ReplyComment & UnimplementedFeatures)[] }

export const MOCK_COMMENT_DATA: CommentWithUnimplementedFeatures[] = [
  {
    id: '456',
    userId: '345',
    message: 'This is the first comment!!',
    isEdited: false,
    trackTimestampS: 12,
    reactCount: 28,
    replyCount: 2,
    isLikedByCurrentUser: true,
    isLikedByArtist: true,
    replies: [
      {
        id: '7890',
        userId: '123',
        message: 'This is a comment reply',
        trackTimestampS: 220,
        isEdited: false,
        reactCount: 3, // if using simple reactions
        createdAt: '2021-01-01T00:00:00Z',
        updatedAt: undefined
      }
    ],
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: undefined
  },
  {
    id: '678',
    userId: '3459',
    message: 'This is the second comment',
    isEdited: false,
    isLikedByCurrentUser: false,
    trackTimestampS: undefined,
    reactCount: 8,
    replyCount: 2,
    replies: undefined,
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: undefined
  }
]
