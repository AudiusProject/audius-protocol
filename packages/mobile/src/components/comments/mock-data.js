export var MOCK_COMMENT_DATA = [
    {
        id: '456',
        userId: '345',
        message: 'This is the first comment!!',
        isPinned: true,
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
                isPinned: false,
                isEdited: false,
                reactCount: 3,
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
        isPinned: false,
        isEdited: false,
        isLikedByCurrentUser: false,
        trackTimestampS: undefined,
        reactCount: 8,
        replyCount: 2,
        replies: undefined,
        createdAt: '2021-01-01T00:00:00Z',
        updatedAt: undefined
    }
];
