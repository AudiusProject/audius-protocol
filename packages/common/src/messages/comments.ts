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
  reply: 'Reply'
}
