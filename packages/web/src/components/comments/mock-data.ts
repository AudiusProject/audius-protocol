import { Comment } from './types'

export const MOCK_COMMENT_DATA: Comment[] = [
  {
    id: 456,
    userId: '345',
    message: 'This is the first comment!!',
    isPinned: true,
    timestampS: 12,
    reactCount: 28,
    replies: [
      {
        id: 7890,
        userId: '123',
        message: 'This is a comment reply',
        timestampS: 220,
        reactCount: 3, // if using simple reactions
        isPinned: false,
        replies: null, // prefer null over empty array but either is fine
        createdAt: '2021-01-01T00:00:00Z',
        updatedAt: null
      }
    ],
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: null
  },
  {
    id: 678,
    userId: '3459',
    message: 'This is the second comment',
    isPinned: false,
    timestampS: undefined,
    reactCount: 8,
    replies: null,
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: null
  }
]
