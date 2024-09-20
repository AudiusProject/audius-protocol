import React, { useCallback, useState } from 'react';
import { useGetUserById } from '@audius/common/api';
import { CommentSectionProvider, useCurrentCommentSection, useDeleteComment, usePinComment, useReportComment } from '@audius/common/context';
import { commentsMessages as messages } from '@audius/common/messages';
import { removeNullable } from '@audius/common/utils';
import { Portal } from '@gorhom/portal';
import { Hint, IconButton, IconKebabHorizontal } from '@audius/harmony-native';
import { useToast } from 'app/hooks/useToast';
import { ActionDrawerWithoutRedux } from '../action-drawer';
import { ConfirmationDrawerWithoutRedux } from '../drawers';
export var CommentOverflowMenu = function (props) {
    var _a = props.comment, id = _a.id, userId = _a.userId, disabled = props.disabled;
    var isPinned = 'isPinned' in props ? props.isPinned : false; // pins dont exist on replies
    var commentUser = useGetUserById({
        id: Number(userId)
    }).data;
    var toast = useToast().toast;
    // Need isOpen and isVisible to account for the closing animation
    var _b = useState(false), isOpen = _b[0], setIsOpen = _b[1];
    var _c = useState(false), isVisible = _c[0], setIsVisible = _c[1];
    var _d = useState(false), isFlagConfirmationOpen = _d[0], setIsFlagConfirmationOpen = _d[1];
    var _e = useState(false), isFlagConfirmationVisible = _e[0], setIsFlagConfirmationVisible = _e[1];
    var _f = useState(false), isFlagAndRemoveConfirmationOpen = _f[0], setIsFlagAndRemoveConfirmationOpen = _f[1];
    var _g = useState(false), isFlagAndRemoveConfirmationVisible = _g[0], setIsFlagAndRemoveConfirmationVisible = _g[1];
    var _h = useState(false), isMuteUserConfirmationOpen = _h[0], setIsMuteUserConfirmationOpen = _h[1];
    var _j = useState(false), isMuteUserConfirmationVisible = _j[0], setIsMuteUserConfirmationVisible = _j[1];
    var _k = useState(false), isPinConfirmationOpen = _k[0], setIsPinConfirmationOpen = _k[1];
    var _l = useState(false), isPinConfirmationVisible = _l[0], setIsPinConfirmationVisible = _l[1];
    var _m = useState(false), isDeleteConfirmationOpen = _m[0], setIsDeleteConfirmationOpen = _m[1];
    var _o = useState(false), isDeleteConfirmationVisible = _o[0], setIsDeleteConfirmationVisible = _o[1];
    var _p = useCurrentCommentSection(), entityId = _p.entityId, isEntityOwner = _p.isEntityOwner, currentUserId = _p.currentUserId, setEditingComment = _p.setEditingComment;
    var isCommentOwner = Number(userId) === currentUserId;
    var pinComment = usePinComment()[0];
    var deleteComment = useDeleteComment()[0];
    var reportComment = useReportComment()[0];
    var rows = [
        isEntityOwner && {
            text: isPinned ? messages.menuActions.unpin : messages.menuActions.pin,
            callback: function () {
                if (isPinned) {
                    // Unpin the comment
                    handlePinComment();
                }
                else {
                    setIsPinConfirmationOpen(true);
                    setIsPinConfirmationVisible(true);
                }
            }
        },
        !isCommentOwner && {
            text: messages.menuActions.flag,
            callback: function () {
                setIsFlagConfirmationOpen(true);
                setIsFlagConfirmationVisible(true);
            }
        },
        isEntityOwner &&
            !isCommentOwner && {
            text: messages.menuActions.flagAndRemove,
            callback: function () {
                setIsFlagAndRemoveConfirmationOpen(true);
                setIsFlagAndRemoveConfirmationVisible(true);
            }
        },
        isEntityOwner &&
            !isCommentOwner && {
            text: messages.menuActions.muteUser,
            callback: function () {
                setIsMuteUserConfirmationOpen(true);
                setIsMuteUserConfirmationVisible(true);
            }
        },
        // TODO: check if receiving notifications
        isCommentOwner && {
            text: messages.menuActions.turnOffNotifications,
            callback: function () { } // TODO
        },
        isCommentOwner && {
            text: messages.menuActions.edit,
            callback: function () { return setEditingComment === null || setEditingComment === void 0 ? void 0 : setEditingComment(props.comment); }
        },
        isCommentOwner && {
            text: messages.menuActions.delete,
            callback: function () {
                setIsDeleteConfirmationOpen(true);
                setIsDeleteConfirmationVisible(true);
            },
            isDestructive: true
        }
    ].filter(removeNullable);
    var handleMuteUser = useCallback(function () {
        // TODO
        toast({
            content: messages.toasts.mutedUser,
            type: 'info'
        });
    }, [toast]);
    var handleFlagComment = useCallback(function () {
        reportComment(id);
        toast({
            content: messages.toasts.flaggedAndRemoved,
            type: 'info'
        });
    }, [reportComment, id, toast]);
    var handleFlagAndRemoveComment = useCallback(function () {
        reportComment(id);
        // TODO: remove comment
        toast({
            content: messages.toasts.flaggedAndRemoved,
            type: 'info'
        });
    }, [reportComment, id, toast]);
    var handlePinComment = useCallback(function () {
        pinComment(id, !isPinned);
        toast({
            content: isPinned ? messages.toasts.unpinned : messages.toasts.pinned,
            type: 'info'
        });
    }, [id, isPinned, pinComment, toast]);
    var handleDeleteComment = useCallback(function () {
        deleteComment(id);
        toast({
            content: messages.toasts.deleted,
            type: 'info'
        });
    }, [deleteComment, id, toast]);
    return (<>
      <IconButton aria-label={messages.menuActions.moreActions} icon={IconKebabHorizontal} size='s' color='subdued' onPress={function () {
            setIsOpen(!isOpen);
            setIsVisible(!isVisible);
        }} disabled={disabled}/>

      <Portal hostName='DrawerPortal'>
        {isVisible ? (<CommentSectionProvider entityId={entityId}>
            <ActionDrawerWithoutRedux rows={rows} isOpen={isOpen} onClose={function () { return setIsOpen(false); }} onClosed={function () { return setIsVisible(false); }}/>
          </CommentSectionProvider>) : null}

        {isFlagConfirmationVisible ? (<ConfirmationDrawerWithoutRedux isOpen={isFlagConfirmationOpen} onClose={function () { return setIsFlagConfirmationOpen(false); }} onClosed={function () { return setIsFlagConfirmationVisible(false); }} messages={{
                header: messages.popups.flagAndRemove.title,
                description: messages.popups.flagAndRemove.body,
                confirm: messages.popups.flagAndRemove.confirm
            }} onConfirm={handleFlagComment}/>) : null}

        {isFlagAndRemoveConfirmationVisible ? (<ConfirmationDrawerWithoutRedux isOpen={isFlagAndRemoveConfirmationOpen} onClose={function () { return setIsFlagAndRemoveConfirmationOpen(false); }} onClosed={function () { return setIsFlagAndRemoveConfirmationVisible(false); }} messages={{
                header: messages.popups.flagAndRemove.title,
                description: "Remove ".concat(commentUser === null || commentUser === void 0 ? void 0 : commentUser.handle, "'s comment?"),
                confirm: messages.popups.flagAndRemove.confirm
            }} onConfirm={handleFlagAndRemoveComment}/>) : null}

        {isPinConfirmationVisible ? (<ConfirmationDrawerWithoutRedux isOpen={isPinConfirmationOpen} onClose={function () { return setIsPinConfirmationOpen(false); }} onClosed={function () { return setIsPinConfirmationVisible(false); }} variant='affirmative' messages={{
                header: messages.popups.pin.title,
                description: messages.popups.pin.body,
                confirm: messages.popups.pin.confirm
            }} onConfirm={handlePinComment}/>) : null}

        {isDeleteConfirmationVisible ? (<ConfirmationDrawerWithoutRedux isOpen={isDeleteConfirmationOpen} onClose={function () { return setIsDeleteConfirmationOpen(false); }} onClosed={function () { return setIsDeleteConfirmationVisible(false); }} messages={{
                header: messages.popups.delete.title,
                description: messages.popups.delete.body,
                confirm: messages.popups.delete.confirm
            }} onConfirm={handleDeleteComment}/>) : null}

        {isMuteUserConfirmationVisible ? (<ConfirmationDrawerWithoutRedux isOpen={isMuteUserConfirmationOpen} onClose={function () { return setIsMuteUserConfirmationOpen(false); }} onClosed={function () { return setIsMuteUserConfirmationVisible(false); }} messages={{
                header: messages.popups.muteUser.title,
                description: messages.popups.muteUser.body(commentUser === null || commentUser === void 0 ? void 0 : commentUser.handle),
                confirm: messages.popups.muteUser.confirm
            }} onConfirm={handleMuteUser}>
            <Hint>{messages.popups.muteUser.hint}</Hint>
          </ConfirmationDrawerWithoutRedux>) : null}
      </Portal>
    </>);
};
