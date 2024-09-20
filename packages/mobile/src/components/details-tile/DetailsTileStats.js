import { formatCount } from '@audius/common/utils';
import { Flex, IconHeart, IconMessage, IconPlay, IconRepost, PlainButton } from '@audius/harmony-native';
/**
 * The stats displayed on track and playlist screens
 */
export var DetailsTileStats = function (_a) {
    var _b = _a.playCount, playCount = _b === void 0 ? 0 : _b, _c = _a.repostCount, repostCount = _c === void 0 ? 0 : _c, _d = _a.favoriteCount, favoriteCount = _d === void 0 ? 0 : _d, _e = _a.commentCount, commentCount = _e === void 0 ? 0 : _e, hidePlayCount = _a.hidePlayCount, hideRepostCount = _a.hideRepostCount, hideFavoriteCount = _a.hideFavoriteCount, hideCommentCount = _a.hideCommentCount, onPressFavorites = _a.onPressFavorites, onPressReposts = _a.onPressReposts;
    var shouldHidePlayCount = hidePlayCount || playCount <= 0;
    var shouldHideRepostCount = hideRepostCount || repostCount <= 0;
    var shouldHideFavoriteCount = hideFavoriteCount || favoriteCount <= 0;
    var shouldHideCommentCount = hideCommentCount || commentCount <= 0;
    if (shouldHideFavoriteCount &&
        shouldHideRepostCount &&
        shouldHidePlayCount &&
        shouldHideCommentCount) {
        return null;
    }
    return (<Flex w='100%' direction='row' gap='xl' alignItems='center' justifyContent='flex-start'>
      {shouldHidePlayCount ? null : (<PlainButton iconLeft={IconPlay}>{formatCount(playCount)}</PlainButton>)}
      {shouldHideRepostCount ? null : (<PlainButton onPress={onPressReposts} iconLeft={IconRepost}>
          {formatCount(repostCount)}
        </PlainButton>)}
      {shouldHideFavoriteCount ? null : (<PlainButton onPress={onPressFavorites} iconLeft={IconHeart}>
          {formatCount(favoriteCount)}
        </PlainButton>)}
      {shouldHideCommentCount ? null : (<PlainButton iconLeft={IconMessage}>
          {formatCount(commentCount)}
        </PlainButton>)}
    </Flex>);
};
