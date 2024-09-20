import { useCurrentCommentSection } from '@audius/common/context';
import { tippingSelectors } from '@audius/common/store';
import { useSelector } from 'react-redux';
import { Flex, IconStar, IconTipping, IconTrophy, Text } from '@audius/harmony-native';
var getSupporters = tippingSelectors.getSupporters;
var iconMap = {
    artist: IconStar,
    topSupporter: IconTrophy,
    tipSupporter: IconTipping
};
var messages = {
    artist: 'Artist',
    topSupporter: 'Top Supporter',
    tipSupporter: 'Tip Supporter'
};
var Badge = function (_a) {
    var type = _a.type;
    if (type === null)
        return null;
    var Icon = iconMap[type];
    return (<Flex direction='row' gap='xs'>
      <Icon color='accent' size='xs'/>
      <Text color='accent' variant='body' size='xs'>
        {messages[type]}
      </Text>
    </Flex>);
};
export var CommentBadge = function (_a) {
    var _b;
    var commentUserId = _a.commentUserId, isArtist = _a.isArtist;
    var artistId = useCurrentCommentSection().artistId;
    var supporters = useSelector(getSupporters);
    var tipSupporterData = (_b = supporters === null || supporters === void 0 ? void 0 : supporters[artistId]) === null || _b === void 0 ? void 0 : _b[commentUserId];
    var isTipSupporter = tipSupporterData !== undefined; // TODO: how to wire this up?
    var isTopSupporter = (tipSupporterData === null || tipSupporterData === void 0 ? void 0 : tipSupporterData.rank) === 1; // TODO: how to wire this up?
    var badgeType = isArtist
        ? 'artist'
        : isTopSupporter
            ? 'topSupporter'
            : isTipSupporter
                ? 'tipSupporter'
                : null;
    return <Badge type={badgeType}/>;
};
