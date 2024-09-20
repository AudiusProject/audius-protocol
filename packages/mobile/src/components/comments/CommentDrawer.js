import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CommentSectionProvider, useCurrentCommentSection } from '@audius/common/context';
import { BottomSheetFlatList, BottomSheetBackdrop, BottomSheetFooter, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Divider, Flex, useTheme } from '@audius/harmony-native';
import { LoadingSpinner } from 'app/harmony-native/components/LoadingSpinner/LoadingSpinner';
import { useDrawer } from 'app/hooks/useDrawer';
import { CommentDrawerForm } from './CommentDrawerForm';
import { CommentDrawerHeader } from './CommentDrawerHeader';
import { CommentSkeleton } from './CommentSkeleton';
import { CommentThread } from './CommentThread';
import { NoComments } from './NoComments';
import { useGestureEventsHandlers } from './useGestureEventHandlers';
import { useScrollEventsHandlers } from './useScrollEventHandlers';
var CommentDrawerContent = function () {
    var _a = useCurrentCommentSection(), comments = _a.comments, isLoading = _a.commentSectionLoading, loadMorePages = _a.loadMorePages, isLoadingMorePages = _a.isLoadingMorePages;
    // Loading state
    if (isLoading) {
        return (<>
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </>);
    }
    // Empty state
    if (!comments || !comments.length) {
        return (<Flex p='l'>
        <NoComments />
      </Flex>);
    }
    return (<BottomSheetFlatList data={comments} keyExtractor={function (_a) {
        var id = _a.id;
        return id;
    }} ListHeaderComponent={<Box h='l'/>} ListFooterComponent={<>
          {isLoadingMorePages ? (<Flex row justifyContent='center' mb='xl' w='100%'>
              <LoadingSpinner style={{ width: 20, height: 20 }}/>
            </Flex>) : null}

          <Box h='l'/>
        </>} enableFooterMarginAdjustment scrollEventsHandlersHook={useScrollEventsHandlers} keyboardShouldPersistTaps='handled' onEndReached={loadMorePages} onEndReachedThreshold={0.3} renderItem={function (_a) {
            var item = _a.item;
            return (<Box ph='l'>
          <CommentThread commentId={item.id}/>
        </Box>);
        }}/>);
};
var BORDER_RADIUS = 40;
export var CommentDrawer = function () {
    var color = useTheme().color;
    var insets = useSafeAreaInsets();
    var _a = useState(), replyingToComment = _a[0], setReplyingToComment = _a[1];
    var _b = useState(), editingComment = _b[0], setEditingComment = _b[1];
    var bottomSheetModalRef = useRef(null);
    var _c = useDrawer('Comment'), entityId = _c.data.entityId, isOpen = _c.isOpen, onClosed = _c.onClosed;
    useEffect(function () {
        var _a;
        if (isOpen) {
            (_a = bottomSheetModalRef.current) === null || _a === void 0 ? void 0 : _a.present();
        }
    }, [isOpen]);
    var handleClose = useCallback(function () {
        onClosed();
    }, [onClosed]);
    return (<>
      <BottomSheetModal ref={bottomSheetModalRef} snapPoints={['66%', '100%']} topInset={insets.top} style={{
            borderTopRightRadius: BORDER_RADIUS,
            borderTopLeftRadius: BORDER_RADIUS,
            overflow: 'hidden'
        }} backgroundStyle={{ backgroundColor: color.background.white }} handleIndicatorStyle={{ backgroundColor: color.neutral.n200 }} gestureEventsHandlersHook={useGestureEventsHandlers} backdropComponent={function (props) { return (<BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior='close'/>); }} footerComponent={function (props) { return (<BottomSheetFooter {...props} bottomInset={insets.bottom}>
            <CommentSectionProvider entityId={entityId} replyingToComment={replyingToComment} setReplyingToComment={setReplyingToComment} editingComment={editingComment} setEditingComment={setEditingComment}>
              <CommentDrawerForm />
            </CommentSectionProvider>
          </BottomSheetFooter>); }} onDismiss={handleClose}>
        <CommentSectionProvider entityId={entityId} replyingToComment={replyingToComment} setReplyingToComment={setReplyingToComment} editingComment={editingComment} setEditingComment={setEditingComment}>
          <CommentDrawerHeader bottomSheetModalRef={bottomSheetModalRef}/>
          <Divider orientation='horizontal'/>
          <CommentDrawerContent />
        </CommentSectionProvider>
      </BottomSheetModal>
      <Box style={{
            backgroundColor: color.background.white,
            position: 'absolute',
            bottom: 0,
            width: '100%',
            zIndex: 5,
            height: insets.bottom
        }}/>
    </>);
};
