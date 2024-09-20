var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useEffect, useRef } from 'react';
import { useGetUserById } from '@audius/common/api';
import { useCurrentCommentSection } from '@audius/common/context';
import { commentsMessages as messages } from '@audius/common/messages';
import { Formik, useFormikContext } from 'formik';
import { Flex, IconButton, IconSend } from '@audius/harmony-native';
import { ProfilePicture } from '../core';
import { HarmonyTextField } from '../fields';
import LoadingSpinner from '../loading-spinner';
var CommentFormContent = function (props) {
    var isLoading = props.isLoading, TextInputComponent = props.TextInputComponent;
    var _a = useCurrentCommentSection(), currentUserId = _a.currentUserId, comments = _a.comments, replyingToComment = _a.replyingToComment, editingComment = _a.editingComment;
    var ref = useRef(null);
    var replyingToUserId = Number(replyingToComment === null || replyingToComment === void 0 ? void 0 : replyingToComment.userId);
    var replyingToUser = useGetUserById({
        id: replyingToUserId
    }, { disabled: !replyingToComment }).data;
    var setFieldValue = useFormikContext().setFieldValue;
    var submitForm = useFormikContext().submitForm;
    /**
     * Populate and focus input when replying to a comment
     */
    useEffect(function () {
        var _a;
        if (replyingToComment && replyingToUser) {
            setFieldValue('commentMessage', "@".concat(replyingToUser.handle, " "));
            (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [replyingToComment, replyingToUser, setFieldValue]);
    /**
     * Populate and focus input when editing a comment
     */
    useEffect(function () {
        var _a;
        if (editingComment) {
            setFieldValue('commentMessage', editingComment.message);
            (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [editingComment, setFieldValue]);
    var message = (comments === null || comments === void 0 ? void 0 : comments.length) ? messages.addComment : messages.firstComment;
    return (<Flex direction='row' gap='m' alignItems='center'>
      {currentUserId ? (<ProfilePicture userId={currentUserId} style={{ width: 40, height: 40, flexShrink: 0 }}/>) : null}
      <HarmonyTextField style={{ flex: 1 }} name='commentMessage' label={messages.addComment} ref={ref} hideLabel placeholder={message} endAdornment={isLoading ? (<LoadingSpinner />) : (<IconButton aria-label='Post comment' icon={IconSend} color='accent' onPress={submitForm}/>)} TextInputComponent={TextInputComponent}/>
    </Flex>);
};
export var CommentForm = function (_a) {
    var onSubmit = _a.onSubmit, _b = _a.initialValue, initialValue = _b === void 0 ? '' : _b, rest = __rest(_a, ["onSubmit", "initialValue"]);
    var handleSubmit = function (_a, _b) {
        var commentMessage = _a.commentMessage;
        var resetForm = _b.resetForm;
        onSubmit(commentMessage);
        resetForm();
    };
    var formInitialValues = { commentMessage: initialValue };
    return (<Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
      <CommentFormContent {...rest}/>
    </Formik>);
};
