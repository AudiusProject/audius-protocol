import React from 'react';
import { useCurrentCommentSection } from '@audius/common/context';
import { Flex, IconButton, IconCloseAlt, Text } from '@audius/harmony-native';
import { CommentSortBar } from './CommentSortBar';
var messages = {
    comments: 'Comments'
};
export var CommentDrawerHeader = function (props) {
    var bottomSheetModalRef = props.bottomSheetModalRef;
    var _a = useCurrentCommentSection(), comments = _a.comments, isLoading = _a.commentSectionLoading;
    var handlePressClose = function () {
        var _a;
        (_a = bottomSheetModalRef.current) === null || _a === void 0 ? void 0 : _a.dismiss();
    };
    return (<Flex p='l' gap='m'>
      <Flex direction='row' w='100%' justifyContent='space-between' alignItems='center'>
        <Text variant='body' size='m'>
          {messages.comments}
          {!isLoading && (comments === null || comments === void 0 ? void 0 : comments.length) ? (<Text color='subdued'>&nbsp;({comments.length})</Text>) : null}
        </Text>
        <IconButton icon={IconCloseAlt} onPress={handlePressClose} color='subdued' size='m'/>
      </Flex>
      <CommentSortBar />
    </Flex>);
};
