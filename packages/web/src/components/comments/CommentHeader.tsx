import { Text } from '@audius/harmony'

export const CommentHeader = ({
  commentCount,
  isLoading
}: {
  commentCount?: number
  isLoading?: boolean
}) => {
  return (
    <Text variant='title' size='l'>
      Comments ({!isLoading ? commentCount : '...'})
    </Text>
  )
}
