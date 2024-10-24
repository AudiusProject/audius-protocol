import { formatCount } from '~/utils'

export const commentsMessages = {
  // Generic messages across the page
  title: 'Comments',
  postComment: 'Post Comment',
  addComment: 'Add a comment',
  noComments: 'Nothing here yet. Be the first to comment!',
  noCommentsOwner:
    'Get the conversation started! Leave a comment to encourage others to join in.',
  noCommentsDescription: 'Be the first to comment on this track',
  viewAll: 'View All',
  showMoreReplies: 'Show More Replies',
  reply: 'Reply',
  replies: 'Replies',
  replyingTo: (handle: string) => `Replying to @${handle}`,
  showReplies: (replyCount: number) =>
    `${formatCount(replyCount)} ${replyCount > 1 ? 'Replies' : 'Reply'}`,
  hideReplies: 'Hide Replies',
  commentsDisabled: 'Comments are disabled for this track',
  edited: 'edited',
  editing: 'Editing comment',
  commentSettings: 'Comment Settings',
  description: 'Prevent certain users from commenting on your tracks.',
  unmute: 'Unmute',
  mute: 'Mute',
  followers: 'Followers',
  noMutedUsers:
    'You haven’t muted any users. Once you do, they will appear here.',
  seeMore: 'See More',
  seeLess: 'See Less',
  newComments: 'New Comments!',

  // Overflow Menu Actions
  menuActions: {
    pin: 'Pin',
    unpin: 'Unpin',
    flagAndHide: 'Flag & Hide',
    flagAndRemove: 'Flag & Remove',
    muteUser: 'Mute User',
    unmuteThread: 'Unmute This Thread',
    muteThread: 'Mute This Thread',
    edit: 'Edit',
    delete: 'Delete',
    moreActions: 'more actions'
  },
  // Toasts/Popups from the overflow menu actions
  toasts: {
    pinned: 'Comment pinned',
    unpinned: 'Comment unpinned',
    deleted: 'Comment deleted',
    mutedUser: 'User muted and comment removed',
    flaggedAndRemoved: 'Comment flagged and removed',
    flaggedAndHidden: 'Comment flagged and hidden',
    mutedNotifs: 'Notifications turned off',
    unmutedNotifs: 'Notifications turned on',
    mutedTrackNotifs: 'Comment notifications turned off',
    unmutedTrackNotifs: 'Comment notifications turned on'
  },
  popups: {
    pin: {
      title: 'Pin comment',
      body: 'If you already pinned a comment, this will replace it',
      confirm: 'Pin',
      cancel: 'Cancel'
    },
    unpin: {
      title: 'Unpin comment',
      body: 'Unpin this comment?',
      confirm: 'Unpin',
      cancel: 'Cancel'
    },
    // Specifically for an artist deleting someone else's comment
    artistDelete: {
      title: 'Delete comment',
      body: (userDisplayName: string | undefined) =>
        `Delete ${userDisplayName}'s comment permanently?`,
      confirm: 'Delete',
      cancel: 'Cancel'
    },
    // An individual deleting their own comment
    delete: {
      title: 'Delete comment',
      body: 'Delete your comment permanently?',
      confirm: 'Delete',
      cancel: 'Cancel'
    },
    muteUser: {
      title: 'Mute User',
      body: (userDisplayName: string | undefined) =>
        `Mute ${userDisplayName} from commenting on your tracks?`,
      hint: 'This will not affect their ability to view your profile or interact with your content.',
      confirm: 'Mute User',
      cancel: 'Cancel'
    },
    unmuteUser: {
      title: 'Unmute User',
      body: (userDisplayName: string | undefined) =>
        `Unmute ${userDisplayName} from commenting on your tracks?`,
      hint: 'You can mute them again from their profile.',
      confirm: 'Unmute User',
      cancel: 'Cancel'
    },
    flagAndHide: {
      title: 'Flag comment',
      body: (userDisplayName: string | undefined) =>
        `Flag and hide ${userDisplayName}'s comment?`,
      confirm: 'Flag',
      cancel: 'Cancel'
    },
    flagAndRemove: {
      title: 'Flag comment',
      body: (userDisplayName: string | undefined) =>
        `Flag and remove ${userDisplayName}'s comment?`,
      confirm: 'Flag',
      cancel: 'Cancel'
    },
    trackNotifications: {
      mute: 'Turn off comment notifications for this track',
      unmute: 'Turn on comment notifications for this track'
    }
  }
}
