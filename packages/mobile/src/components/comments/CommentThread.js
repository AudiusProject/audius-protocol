var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState } from 'react';
import { useGetCommentById, useGetCommentRepliesById } from '@audius/common/api';
import { commentsMessages as messages } from '@audius/common/messages';
import { Box, Flex, IconCaretDown, IconCaretUp, PlainButton } from '@audius/harmony-native';
import { CommentBlock } from './CommentBlock';
export var CommentThread = function (props) {
    var _a, _b, _c, _d, _e, _f;
    var commentId = props.commentId;
    var rootComment = useGetCommentById({
        id: commentId
    }).data;
    var _g = useState({}), hiddenReplies = _g[0], setHiddenReplies = _g[1];
    var toggleReplies = function (commentId) {
        var newHiddenReplies = __assign({}, hiddenReplies);
        newHiddenReplies[commentId] = !newHiddenReplies[commentId];
        setHiddenReplies(newHiddenReplies);
    };
    var _h = useState(false), hasLoadedMore = _h[0], setHasLoadedMore = _h[1];
    var _j = useGetCommentRepliesById({ id: commentId }, {
        // Root comments already have the first 3 replies so we only need to load more when the user requests them
        disabled: ((_b = (_a = rootComment === null || rootComment === void 0 ? void 0 : rootComment.replies) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) < 3 || !hasLoadedMore,
        pageSize: 3,
        // Start at the 4th reply
        startOffset: 3
    }), moreReplies = _j.data, loadMore = _j.loadMore, hasMore = _j.hasMore;
    var hasMoreReplies = hasMore && ((_d = (_c = rootComment === null || rootComment === void 0 ? void 0 : rootComment.replies) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) >= 3;
    var handleLoadMoreReplies = function () {
        if (hasLoadedMore) {
            loadMore();
        }
        else {
            // If hasLoadedMore is false, this is the first time the user is requesting more replies
            // In this case audius-query will automatically fetch the first page of replies, no need to trigger via loadMore()
            setHasLoadedMore(true);
        }
    };
    // Combine the replies from the root comment and the additional loaded replies
    var allReplies = __spreadArray(__spreadArray([], ((_e = rootComment === null || rootComment === void 0 ? void 0 : rootComment.replies) !== null && _e !== void 0 ? _e : []), true), (moreReplies !== null && moreReplies !== void 0 ? moreReplies : []), true);
    if (!rootComment)
        return null;
    var replyCount = rootComment.replyCount;
    return (<>
      <CommentBlock commentId={rootComment.id}/>
      <Flex pl={40} direction='column' mv='s' gap='s' alignItems='flex-start'>
        {((_f = allReplies.length) !== null && _f !== void 0 ? _f : 0) > 0 ? (<Box mv='xs'>
            <PlainButton onPress={function () { return toggleReplies(rootComment.id); }} variant='subdued' iconLeft={hiddenReplies[rootComment.id] ? IconCaretDown : IconCaretUp}>
              {hiddenReplies[rootComment.id]
                ? messages.showReplies(replyCount)
                : messages.hideReplies}
            </PlainButton>
          </Box>) : null}
        {hiddenReplies[rootComment.id] ? null : (<>
            <Flex direction='column' gap='l'>
              {allReplies === null || allReplies === void 0 ? void 0 : allReplies.map(function (reply) { return (<Flex w='100%' key={reply.id}>
                  <CommentBlock commentId={reply.id} parentCommentId={rootComment.id}/>
                </Flex>); })}
            </Flex>

            {hasMoreReplies ? (<PlainButton onPress={handleLoadMoreReplies} variant='subdued'>
                {messages.showMoreReplies}
              </PlainButton>) : null}
          </>)}
      </Flex>
    </>);
};
