import React from 'react';
import { useCurrentCommentSection, useEditComment, usePostComment } from '@audius/common/context';
import { Status } from '@audius/common/models';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Box } from '@audius/harmony-native';
import { CommentForm } from './CommentForm';
export var CommentDrawerForm = function () {
    var _a = useCurrentCommentSection(), editingComment = _a.editingComment, replyingToComment = _a.replyingToComment;
    var _b = usePostComment(), postComment = _b[0], postCommentStatus = _b[1].status;
    var editComment = useEditComment()[0];
    var handlePostComment = function (message) {
        if (editingComment) {
            editComment(editingComment.id, message);
            return;
        }
        postComment(message, replyingToComment === null || replyingToComment === void 0 ? void 0 : replyingToComment.id);
    };
    var isLoading = postCommentStatus === Status.LOADING;
    return (<Box p='l' backgroundColor='white'>
      <CommentForm onSubmit={handlePostComment} isLoading={isLoading} TextInputComponent={BottomSheetTextInput}/>
    </Box>);
};
