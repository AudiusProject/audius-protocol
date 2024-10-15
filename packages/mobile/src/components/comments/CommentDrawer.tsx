import type { RefObject } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { SearchCategory } from '@audius/common/api'
import { useGetSearchResults } from '@audius/common/api'
import type { ReplyingAndEditingState } from '@audius/common/context'
import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import type { UserMetadata } from '@audius/common/models'
import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import type {
  BottomSheetFlatListMethods,
  BottomSheetFooterProps
} from '@gorhom/bottom-sheet'
import {
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal
} from '@gorhom/bottom-sheet'
import type { TouchableOpacityProps } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import { Box, Divider, Flex, Text, useTheme } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { LoadingSpinner } from 'app/harmony-native/components/LoadingSpinner/LoadingSpinner'
import { useDrawer } from 'app/hooks/useDrawer'

import { CommentDrawerForm } from './CommentDrawerForm'
import { CommentDrawerHeader } from './CommentDrawerHeader'
import { CommentSkeleton } from './CommentSkeleton'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'
import { useGestureEventsHandlers } from './useGestureEventHandlers'
import { useScrollEventsHandlers } from './useScrollEventHandlers'

const { getUserId } = accountSelectors

type UserListItemProps = {
  user: UserMetadata
} & Pick<TouchableOpacityProps, 'onPress'>

const UserListItem = (props: UserListItemProps) => {
  const { user, onPress } = props

  return (
    <TouchableOpacity onPress={onPress}>
      <Flex direction='row' p='s' gap='s' borderRadius='s'>
        <ProfilePicture userId={user.user_id} size='medium' />
        <Flex direction='column'>
          <Text variant='body' size='s'>
            {user.name}
            <UserBadges user={user} badgeSize={10} hideName />
          </Text>
          <Text variant='body' size='xs' color='default'>
            @{user.handle}
          </Text>
        </Flex>
      </Flex>
    </TouchableOpacity>
  )
}

type CommentDrawerAutocompleteContentProps = {
  query: string
  onSelect: (user: UserMetadata) => void
}

const CommentDrawerAutocompleteContent = ({
  query,
  onSelect
}: CommentDrawerAutocompleteContentProps) => {
  const currentUserId = useSelector(getUserId)

  const params = {
    query,
    category: 'users' as SearchCategory,
    currentUserId,
    limit: 10,
    offset: 0
  }

  const { data, status } = useGetSearchResults(params, { debounce: 500 })

  // No search state
  if (query === '') {
    return (
      <Flex p='l'>
        <Text>Search Users</Text>
      </Flex>
    )
  }

  // Loading state
  if (status === Status.LOADING || status === Status.IDLE) {
    return (
      <Flex p='l' alignItems='center'>
        <LoadingSpinner style={{ height: 24 }} />
      </Flex>
    )
  }

  // Empty state
  if (!data || !data.users || !data.users.length) {
    return (
      <Flex p='l'>
        <Text>No User Results</Text>
      </Flex>
    )
  }

  return (
    <BottomSheetFlatList
      data={data.users}
      keyExtractor={({ user_id }) => user_id.toString()}
      ListHeaderComponent={<Box h='l' />}
      enableFooterMarginAdjustment
      scrollEventsHandlersHook={useScrollEventsHandlers}
      keyboardShouldPersistTaps='handled'
      renderItem={({ item }) => (
        <Box ph='l'>
          <UserListItem user={item} onPress={() => onSelect(item)} />
        </Box>
      )}
    />
  )
}

const CommentDrawerContent = (props: {
  commentListRef: RefObject<BottomSheetFlatListMethods>
}) => {
  const { commentListRef } = props
  const {
    commentIds,
    commentSectionLoading: isLoading,
    loadMorePages,
    isLoadingMorePages
  } = useCurrentCommentSection()

  // Loading state
  if (isLoading) {
    return (
      <>
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </>
    )
  }

  // Empty state
  if (!commentIds || !commentIds.length) {
    return (
      <Flex p='l'>
        <NoComments />
      </Flex>
    )
  }

  return (
    <BottomSheetFlatList
      ref={commentListRef}
      data={commentIds}
      keyExtractor={(id) => id.toString()}
      ListHeaderComponent={<Box h='l' />}
      ListFooterComponent={
        <>
          {isLoadingMorePages ? (
            <Flex row justifyContent='center' mb='xl' w='100%'>
              <LoadingSpinner style={{ width: 20, height: 20 }} />
            </Flex>
          ) : null}

          <Box h='l' />
        </>
      }
      enableFooterMarginAdjustment
      scrollEventsHandlersHook={useScrollEventsHandlers}
      keyboardShouldPersistTaps='handled'
      onEndReached={loadMorePages}
      onEndReachedThreshold={0.3}
      renderItem={({ item: id }) => (
        <Box ph='l'>
          <CommentThread commentId={id} />
        </Box>
      )}
    />
  )
}

const BORDER_RADIUS = 40

export const CommentDrawer = () => {
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const commentListRef = useRef<BottomSheetFlatListMethods>(null)

  const [onAutocomplete, setOnAutocomplete] = useState<
    (user: UserMetadata) => void
  >(() => {})
  const [autoCompleteActive, setAutoCompleteActive] = useState(false)
  const [acText, setAcText] = useState('')
  const [replyingAndEditingState, setReplyingAndEditingState] =
    useState<ReplyingAndEditingState>()

  const setAutocompleteHandler = useCallback(
    (autocompleteHandler: (user: UserMetadata) => void) => {
      setOnAutocomplete(() => autocompleteHandler)
    },
    []
  )

  const onAutoCompleteChange = useCallback((active: boolean, text: string) => {
    setAcText(text)
    setAutoCompleteActive(active)
  }, [])

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const {
    data: { entityId },
    isOpen,
    onClosed
  } = useDrawer('Comment')

  useEffect(() => {
    if (isOpen) {
      bottomSheetModalRef.current?.present()
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    onClosed()
  }, [onClosed])

  const renderFooterComponent = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <Divider orientation='horizontal' />
        <CommentSectionProvider
          entityId={entityId}
          replyingAndEditingState={replyingAndEditingState}
          setReplyingAndEditingState={setReplyingAndEditingState}
        >
          <CommentDrawerForm
            commentListRef={commentListRef}
            onAutocompleteChange={onAutoCompleteChange}
            setAutocompleteHandler={setAutocompleteHandler}
          />
        </CommentSectionProvider>
      </BottomSheetFooter>
    ),
    // intentionally excluding insets.bottom because it causes a rerender
    // when the keyboard is opened on android, causing the keyboard to close
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      entityId,
      onAutoCompleteChange,
      setAutocompleteHandler,
      replyingAndEditingState
    ]
  )

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['66%', '100%']}
        topInset={insets.top}
        style={{
          borderTopRightRadius: BORDER_RADIUS,
          borderTopLeftRadius: BORDER_RADIUS,
          overflow: 'hidden'
        }}
        backgroundStyle={{ backgroundColor: color.background.white }}
        handleIndicatorStyle={{ backgroundColor: color.neutral.n200 }}
        gestureEventsHandlersHook={useGestureEventsHandlers}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior='close'
          />
        )}
        footerComponent={renderFooterComponent}
        onDismiss={handleClose}
        android_keyboardInputMode='adjustResize'
      >
        <CommentSectionProvider
          entityId={entityId}
          replyingAndEditingState={replyingAndEditingState}
          setReplyingAndEditingState={setReplyingAndEditingState}
        >
          <CommentDrawerHeader
            minimal={autoCompleteActive}
            bottomSheetModalRef={bottomSheetModalRef}
          />
          <Divider orientation='horizontal' />
          {autoCompleteActive ? (
            <CommentDrawerAutocompleteContent
              query={acText}
              onSelect={onAutocomplete}
            />
          ) : (
            <CommentDrawerContent commentListRef={commentListRef} />
          )}
        </CommentSectionProvider>
      </BottomSheetModal>
      <Box
        style={{
          backgroundColor: color.background.white,
          position: 'absolute',
          bottom: 0,
          width: '100%',
          zIndex: 5,
          height: insets.bottom
        }}
      />
    </>
  )
}
