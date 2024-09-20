import { isContentCollectibleGated, isContentFollowGated, isContentTipGated } from '@audius/common/models';
import { PurchaseableContentType } from '@audius/common/store';
import { DetailsTileHasAccess } from './DetailsTileHasAccess';
import { DetailsTileNoAccess } from './DetailsTileNoAccess';
export var DetailsTileGatedAccess = function (_a) {
    var trackId = _a.trackId, streamConditions = _a.streamConditions, isOwner = _a.isOwner, hasStreamAccess = _a.hasStreamAccess, style = _a.style, contentType = _a.contentType;
    var shouldDisplay = isContentCollectibleGated(streamConditions) ||
        isContentFollowGated(streamConditions) ||
        isContentTipGated(streamConditions);
    if (!shouldDisplay)
        return null;
    if (hasStreamAccess) {
        return (<DetailsTileHasAccess streamConditions={streamConditions} isOwner={isOwner} style={style} contentType={contentType}/>);
    }
    return (<DetailsTileNoAccess trackId={trackId} 
    // Currently only special-access tracks are supported
    contentType={PurchaseableContentType.TRACK} streamConditions={streamConditions} style={style}/>);
};
