import { useGetPlaylistById, useGetCurrentUserId } from '@audius/common/api';
import { useFeatureFlag } from '@audius/common/hooks';
import { FeatureFlags } from '@audius/common/services';
import { cacheCollectionsSelectors } from '@audius/common/store';
import { useSelector } from 'react-redux';
import { Flex, IconButton, IconKebabHorizontal, IconPencil, IconRocket, IconShare } from '@audius/harmony-native';
import { FavoriteButton } from 'app/components/favorite-button';
import { RepostButton } from 'app/components/repost-button';
import { makeStyles } from 'app/styles';
var getCollectionHasHiddenTracks = cacheCollectionsSelectors.getCollectionHasHiddenTracks, getIsCollectionEmpty = cacheCollectionsSelectors.getIsCollectionEmpty;
var getMessages = function (collectionType) { return ({
    publishButtonEmptyDisabledContent: 'You must add at least 1 track.',
    publishButtonHiddenDisabledContent: "You cannot make a ".concat(collectionType, " with hidden tracks public."),
    shareButtonDisabledHint: "You can\u2019t share an empty ".concat(collectionType, "."),
    shareButtonLabel: 'Share Content',
    overflowButtonLabel: 'More Options',
    editButtonLabel: 'Edit Content',
    publishButtonLabel: 'Publish Content'
}); };
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing;
    return ({
        actionButton: {
            width: spacing(8),
            height: spacing(8)
        }
    });
});
/**
 * The action buttons on track and playlist screens
 */
export var DetailsTileActionButtons = function (_a) {
    var collectionId = _a.collectionId, ddexApp = _a.ddexApp, hasReposted = _a.hasReposted, hasSaved = _a.hasSaved, isCollection = _a.isCollection, isOwner = _a.isOwner, isPublished = _a.isPublished, hideFavorite = _a.hideFavorite, hideOverflow = _a.hideOverflow, hideRepost = _a.hideRepost, hideShare = _a.hideShare, onPressEdit = _a.onPressEdit, onPressPublish = _a.onPressPublish, onPressOverflow = _a.onPressOverflow, onPressRepost = _a.onPressRepost, onPressSave = _a.onPressSave, onPressShare = _a.onPressShare;
    var isHiddenPaidScheduledEnabled = useFeatureFlag(FeatureFlags.HIDDEN_PAID_SCHEDULED).isEnabled;
    var styles = useStyles();
    var isCollectionEmpty = useSelector(function (state) {
        return getIsCollectionEmpty(state, { id: collectionId });
    });
    var currentUserId = useGetCurrentUserId({}).data;
    var collection = useGetPlaylistById({
        playlistId: collectionId,
        currentUserId: currentUserId
    }, { disabled: !collectionId || !isCollection }).data;
    var collectionHasHiddenTracks = useSelector(function (state) {
        return getCollectionHasHiddenTracks(state, { id: collectionId });
    });
    var messages = getMessages((collection === null || collection === void 0 ? void 0 : collection.is_album) ? 'album' : 'playlist');
    var repostButton = (<RepostButton wrapperStyle={styles.actionButton} onPress={onPressRepost} isActive={!isOwner && hasReposted} isDisabled={isOwner}/>);
    var favoriteButton = (<FavoriteButton wrapperStyle={styles.actionButton} onPress={onPressSave} isActive={!isOwner && hasSaved} isDisabled={isOwner}/>);
    var shareButton = (<IconButton color='subdued' 
    // TODO: Remove after AnimatedButton uses IconButton
    icon={IconShare} disabled={isCollectionEmpty} disabledHint={messages.shareButtonDisabledHint} onPress={onPressShare} aria-label={messages.shareButtonLabel} size='2xl' 
    // TODO: Remove after AnimatedButton uses IconButton
    style={{ padding: 0 }}/>);
    var overflowMenu = (<IconButton color='subdued' icon={IconKebabHorizontal} onPress={onPressOverflow} aria-label={messages.overflowButtonLabel} size='2xl' 
    // TODO: Remove after AnimatedButton uses IconButton
    style={{ padding: 0 }}/>);
    var editButton = (<IconButton color='subdued' icon={IconPencil} onPress={onPressEdit} aria-label={messages.editButtonLabel} size='2xl'/>);
    var publishButton = (<IconButton color='subdued' icon={IconRocket} disabled={isCollectionEmpty ||
            (collectionHasHiddenTracks && !isHiddenPaidScheduledEnabled)} disabledHint={collectionHasHiddenTracks
            ? messages.publishButtonHiddenDisabledContent
            : messages.publishButtonEmptyDisabledContent} aria-label={messages.publishButtonLabel} onPress={onPressPublish} size='2xl'/>);
    return (<Flex direction='row' justifyContent='center' gap='xl'>
      {isOwner || ddexApp || hideRepost ? null : repostButton}
      {isOwner || hideFavorite ? null : favoriteButton}
      {hideShare ? null : shareButton}
      {isOwner && !ddexApp ? editButton : null}
      {isOwner && !isPublished ? publishButton : null}
      {hideOverflow ? null : overflowMenu}
    </Flex>);
};
