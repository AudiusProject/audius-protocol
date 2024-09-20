import { CommentSectionProvider, useCurrentCommentSection, usePostComment } from '@audius/common/context';
import { commentsMessages as messages } from '@audius/common/messages';
import { Status } from '@audius/common/models';
import { TouchableOpacity } from 'react-native';
import { Flex, IconCaretRight, Paper, PlainButton, Text } from '@audius/harmony-native';
import { useDrawer } from 'app/hooks/useDrawer';
import Skeleton from '../skeleton';
import { CommentBlock } from './CommentBlock';
import { CommentForm } from './CommentForm';
var CommentSectionHeader = function () {
    var _a = useCurrentCommentSection(), entityId = _a.entityId, isLoading = _a.commentSectionLoading, comments = _a.comments;
    var openDrawer = useDrawer('Comment').onOpen;
    var handlePressViewAll = function () {
        openDrawer({ entityId: entityId });
    };
    var isShowingComments = !isLoading && (comments === null || comments === void 0 ? void 0 : comments.length);
    return (<Flex direction='row' w='100%' justifyContent='space-between' alignItems='center'>
      <Text variant='title' size='m'>
        Comments
        {isShowingComments ? (<Text color='subdued'>&nbsp;({comments.length})</Text>) : null}
      </Text>
      {isShowingComments ? (<PlainButton onPress={handlePressViewAll} iconRight={IconCaretRight} variant='subdued'>
          {messages.viewAll}
        </PlainButton>) : null}
    </Flex>);
};
var CommentSectionContent = function () {
    var _a = useCurrentCommentSection(), isLoading = _a.commentSectionLoading, comments = _a.comments;
    var _b = usePostComment(), postComment = _b[0], postCommentStatus = _b[1].status;
    var handlePostComment = function (message) {
        postComment(message, undefined);
    };
    // Loading state
    if (isLoading) {
        return (<Flex direction='row' gap='s' alignItems='center'>
        <Skeleton width={40} height={40} style={{ borderRadius: 100 }}/>
        <Flex gap='s'>
          <Skeleton height={20} width={240}/>
          <Skeleton height={20} width={160}/>
        </Flex>
      </Flex>);
    }
    // Empty state
    if (!comments || !comments.length) {
        return (<Flex gap='m'>
        <Text variant='body'>{messages.noComments}</Text>
        <CommentForm onSubmit={handlePostComment} isLoading={postCommentStatus === Status.LOADING}/>
      </Flex>);
    }
    return <CommentBlock commentId={comments[0].id} hideActions/>;
};
export var CommentSection = function (props) {
    var entityId = props.entityId;
    var openDrawer = useDrawer('Comment').onOpen;
    var handlePress = function () {
        openDrawer({ entityId: entityId });
    };
    return (<CommentSectionProvider entityId={entityId}>
      <Flex gap='s' direction='column' w='100%' alignItems='flex-start'>
        <CommentSectionHeader />
        <Paper w='100%' direction='column' gap='s' p='l'>
          <TouchableOpacity onPress={handlePress}>
            <CommentSectionContent />
          </TouchableOpacity>
        </Paper>
      </Flex>
    </CommentSectionProvider>);
};
