import { formatCount, pluralize } from '~/utils'

export const commentsMessages = {
  title: 'Comments',
  postComment: 'Post Comment',
  addComment: 'Add a comment',
  firstComment: 'Be the first to comment!',
  noComments: 'Nothing here yet',
  noCommentsDescription: 'Be the first to comment on this track',
  viewAll: 'View All',
  showMoreReplies: 'Show More Replies',
  replies: 'Replies',
  showReplies: (replyCount: number) =>
    `${formatCount(replyCount)} ${pluralize('Reply', replyCount)}`,
  hideReplies: 'Hide Replies',
  commentsDisabled: 'Comments are disabled for this track',
  edited: 'edited',
  reply: 'Reply',
  toasts: {
    pin: (isPinned: boolean) =>
      isPinned ? 'Comment unpinned' : 'Comment pinned',
    delete: 'Comment deleted',
    muteUser: 'User muted and comment removed',
    flagAndRemove: 'Comment flagged and removed',
    muteNotifs: (isMuted: boolean) =>
      isMuted ? 'Notifications turned on' : 'Notifications turned off'
  },
  popups: {
    pin: 'If you already pinned a comment, this will replace it',
    unpin: 'Unpin this comment?',
    artistDelete: (userDisplayName: string) =>
      `Delete ${userDisplayName}'s comment?`,
    delete: 'Delete your comment permanently?',
    mute: {
      body: (userDisplayName: string) =>
        `Mute ${userDisplayName} from commenting on your content?`,
      hint: 'This will not affect their ability to view your profile or interact with your content.'
    },
    flagAndRemove: 'Flag and hide this comment?'
  },
  pin: (isPinned: boolean) => (isPinned ? 'Unpin' : 'Pin'),
  edit: 'Edit',
  delete: 'Delete',
  report: 'Flag & Remove',
  block: 'Mute User',
  muteNotifs: (isMuted: boolean) =>
    isMuted ? 'Turn on notifications' : 'Turn off notifications'
}
