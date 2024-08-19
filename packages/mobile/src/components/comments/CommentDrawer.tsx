import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import { FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Box, Divider, Flex, Text } from '@audius/harmony-native'
import { FULL_DRAWER_HEIGHT, NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'

import Skeleton from '../skeleton'

import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

const CommentDrawerHeader = () => {
  const { comments, commentSectionLoading: isLoading } =
    useCurrentCommentSection()

  return (
    <Flex>
      <Flex direction='row' w='100%' justifyContent='space-between' p='l'>
        <Text variant='body' size='m'>
          Comments
          {!isLoading && comments?.length ? (
            <Text color='subdued'>&nbsp;({comments.length})</Text>
          ) : null}
        </Text>
      </Flex>
      <Divider orientation='horizontal' />
    </Flex>
  )
}

const CommentDrawerContent = () => {
  const { comments, commentSectionLoading: isLoading } =
    useCurrentCommentSection()

  // Loading state
  if (isLoading) {
    return (
      <Flex direction='row' gap='s' alignItems='center' p='l'>
        <Skeleton width={40} height={40} style={{ borderRadius: 100 }} />
        <Flex gap='s'>
          <Skeleton height={20} width={240} />
          <Skeleton height={20} width={160} />
        </Flex>
      </Flex>
    )
  }

  // Empty state
  if (!comments || !comments.length) {
    return (
      <Flex p='l'>
        <NoComments />
      </Flex>
    )
  }

  return (
    <Flex>
      {comments.length === 0 ? <NoComments /> : null}
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <Box ph='l'>
            <CommentThread commentId={item.id} />
          </Box>
        )}
      />
    </Flex>
  )
}

// TODO: make a separate expandable drawer component
export const CommentDrawer = () => {
  const insets = useSafeAreaInsets()
  const {
    data: { userId, entityId, isEntityOwner, artistId }
  } = useDrawer('Comment')
  return (
    <NativeDrawer drawerName='Comment'>
      <Flex
        style={{
          height: FULL_DRAWER_HEIGHT - insets.top - insets.bottom
        }}
      >
        <CommentSectionProvider
          currentUserId={userId}
          artistId={artistId}
          entityId={entityId}
          isEntityOwner={isEntityOwner}
          playTrack={() => {}} // TODO
        >
          <Flex direction='column' gap='m' mt='2xl'>
            <CommentDrawerHeader />
            <CommentDrawerContent />
          </Flex>
        </CommentSectionProvider>
      </Flex>
    </NativeDrawer>
  )
}
