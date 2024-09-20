import { useState } from 'react';
import { useGetCommentById, useGetUserById } from '@audius/common/api';
import { useCurrentCommentSection, useReactToComment } from '@audius/common/context';
import { commentsMessages as messages } from '@audius/common/messages';
import { css } from '@emotion/native';
import { ArtistPick, Box, CommentText, Flex, PlainButton, Text, TextLink, Timestamp } from '@audius/harmony-native';
import { formatCommentTrackTimestamp } from 'app/utils/comments';
import { ProfilePicture } from '../core/ProfilePicture';
import { FavoriteButton } from '../favorite-button';
import { UserLink } from '../user-link';
import { CommentBadge } from './CommentBadge';
import { CommentOverflowMenu } from './CommentOverflowMenu';
export var CommentBlockInternal = function (props) {
    var comment = props.comment, hideActions = props.hideActions;
    var _a = useCurrentCommentSection(), artistId = _a.artistId, setReplyingToComment = _a.setReplyingToComment;
    var message = comment.message, _b = comment.reactCount, reactCount = _b === void 0 ? 0 : _b, trackTimestampS = comment.trackTimestampS, commentId = comment.id, createdAt = comment.createdAt, commentUserIdStr = comment.userId, isEdited = comment.isEdited, isArtistReacted = comment.isArtistReacted, isCurrentUserReacted = comment.isCurrentUserReacted;
    var isTombstone = 'isTombstone' in comment ? !!comment.isTombstone : false;
    var isPinned = 'isPinned' in comment ? comment.isPinned : false; // pins dont exist on replies
    var reactToComment = useReactToComment()[0];
    var commentUserId = Number(commentUserIdStr);
    useGetUserById({ id: commentUserId });
    var _c = useState(isCurrentUserReacted), reactionState = _c[0], setReactionState = _c[1]; // TODO: need to pull starting value from metadata
    var isCommentByArtist = commentUserId === artistId;
    var handleCommentReact = function () {
        setReactionState(!reactionState);
        reactToComment(commentId, !reactionState);
    };
    return (<Flex direction='row' w='100%' gap='s' style={css({ opacity: isTombstone ? 0.5 : 1 })}>
      <ProfilePicture style={{ width: 32, height: 32, flexShrink: 0 }} userId={commentUserId}/>
      <Flex gap='xs' w='100%' alignItems='flex-start' style={{ flexShrink: 1 }}>
        <Box style={{ position: 'absolute', top: 0, right: 0 }}>
          <CommentBadge isArtist={isCommentByArtist} commentUserId={commentUserId}/>
        </Box>
        {isPinned || isArtistReacted ? (<Flex direction='row' justifyContent='space-between' w='100%'>
            <ArtistPick isLiked={isArtistReacted} isPinned={isPinned}/>
          </Flex>) : null}
        {!isTombstone ? (<Flex direction='row' gap='s' alignItems='center'>
            <UserLink size='s' userId={commentUserId} strength='strong'/>
            <Flex direction='row' gap='xs' alignItems='center' h='100%'>
              <Timestamp time={new Date(createdAt)}/>
              {trackTimestampS !== undefined ? (<>
                  <Text color='subdued' size='xs'>
                    •
                  </Text>

                  <TextLink size='xs' variant='active'>
                    {formatCommentTrackTimestamp(trackTimestampS)}
                  </TextLink>
                </>) : null}
            </Flex>
          </Flex>) : null}
        <CommentText>
          {message}
          {isEdited ? <Text color='subdued'> ({messages.edited})</Text> : null}
        </CommentText>
        {!hideActions ? (<>
            <Flex direction='row' gap='l' alignItems='center'>
              <Flex direction='row' alignItems='center' gap='xs'>
                <FavoriteButton onPress={handleCommentReact} isActive={reactionState} wrapperStyle={{ height: 20, width: 20 }} isDisabled={isTombstone}/>
                {!isTombstone ? (<Text color='default' size='s'>
                    {reactCount}
                  </Text>) : null}
              </Flex>
              <PlainButton variant='subdued' onPress={function () {
                setReplyingToComment === null || setReplyingToComment === void 0 ? void 0 : setReplyingToComment(comment);
            }} disabled={isTombstone}>
                {messages.reply}
              </PlainButton>
              <CommentOverflowMenu comment={comment} disabled={isTombstone}/>
            </Flex>
          </>) : null}
      </Flex>
    </Flex>);
};
// This is an extra component wrapper because the comment data coming back from aquery could be undefined
// There's no way to return early in the above component due to rules of hooks ordering
export var CommentBlock = function (props) {
    var comment = useGetCommentById({ id: props.commentId }).data;
    if (!comment)
        return null;
    return <CommentBlockInternal {...props} comment={comment}/>;
};
