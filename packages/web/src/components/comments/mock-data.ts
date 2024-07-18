import { Comment } from './types'

export const MOCK_COMMENT_DATA: Comment[] = [
  {
    id: 456,
    userId: 345,
    message: 'This is the first comment!!',
    is_pinned: true,
    timestamp_s: 123,
    react_count: 28,
    replies: [
      {
        id: 7890,
        userId: 123,
        message: 'This is a comment reply',
        timestamp_s: 123,
        react_count: 3, // if using simple reactions
        is_pinned: false,
        replies: null, // prefer null over empty array but either is fine
        created_at: new Date('2021-01-01T00:00:00Z'),
        updated_at: null
      }
    ],
    created_at: new Date('2021-01-01T00:00:00Z'),
    updated_at: null
  },
  {
    id: 678,
    userId: 3459,
    message: 'This is the second comment',
    is_pinned: false,
    timestamp_s: 123,
    react_count: 8,
    replies: null,
    created_at: new Date('2021-01-01T00:00:00Z'),
    updated_at: null
  }
]
