import { GetNotificationsValidTypesEnum as ValidTypes } from '@audius/sdk'

export const useNotificationValidTypes = () => {
  return [
    ValidTypes.RepostOfRepost,
    ValidTypes.SaveOfRepost,
    ValidTypes.TrendingPlaylist,
    ValidTypes.TrendingUnderground,
    ValidTypes.Tastemaker,
    ValidTypes.UsdcPurchaseBuyer,
    ValidTypes.UsdcPurchaseSeller,
    ValidTypes.TrackAddedToPurchasedAlbum,
    ValidTypes.RequestManager,
    ValidTypes.ApproveManagerRequest,
    ValidTypes.Comment,
    ValidTypes.CommentThread,
    ValidTypes.CommentMention,
    ValidTypes.CommentReaction,
    ValidTypes.ClaimableReward,
    ValidTypes.ListenStreakReminder,
    ValidTypes.ArtistRemixContestEnded,
    ValidTypes.ArtistRemixContestEndingSoon,
    ValidTypes.FanRemixContestStarted,
    ValidTypes.FanRemixContestEnded,
    ValidTypes.FanRemixContestEndingSoon,
    ValidTypes.ArtistRemixContestSubmissions
  ]
}
