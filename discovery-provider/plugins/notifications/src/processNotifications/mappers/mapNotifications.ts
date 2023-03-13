import { Knex } from 'knex'

import { logger } from '../../logger'
import { NotificationRow } from '../../types/dn'
import { DMEntityType } from '../../email/notifications/types'
import {
  EmailNotification,
  DMEmailNotification,
  FollowNotification,
  RepostNotification,
  SaveNotification,
  RemixNotification,
  CosignRemixNotification,
  SupporterRankUpNotification,
  MilestoneNotification,
  ReactionNotification,
  TipSendNotification,
  TipReceiveNotification,
  SupporterDethronedNotification,
  SupportingRankUpNotification,
  ChallengeRewardNotification,
  AddTrackToPlaylistNotification,
  CreateTrackNotification,
  CreatePlaylistNotification,
  AnnouncementNotification,
  TrendingTrackNotification
} from '../../types/notifications'
import { Follow } from './follow'
import { Repost } from './repost'
import { Save } from './save'
import { Remix } from './remix'
import { CosignRemix } from './cosign'
import { SupporterRankUp } from './supporterRankUp'
import { MessageEmail } from './messageEmail'
import { Milestone } from './milestone'
import { Reaction } from './reaction'
import { TipSend } from './tipSend'
import { TipReceive } from './tipReceive'
import { SupporterDethroned } from './supporterDethroned'
import { SupportingRankUp } from './supportingRankUp'
import { ChallengeReward } from './challengeReward'
import { AddTrackToPlaylist } from './addTrackToPlaylist'
import { Create } from './create'
import { Announcement } from './announcement'
import { TrendingTrack } from './trendingTrack'

export const mapNotifications = (notifications: (NotificationRow | EmailNotification)[], dnDb: Knex, identityDb: Knex) => {
  return notifications.map((notification) => mapNotification(notification, dnDb, identityDb)).filter(Boolean)
}

const mapNotification = (notification: NotificationRow | EmailNotification, dnDb: Knex, identityDb: Knex) => {
  if (notification.type == 'follow') {
    const followNotification = notification as NotificationRow & { data: FollowNotification }
    return new Follow(dnDb, identityDb, followNotification)
  }
  else if (notification.type == 'repost') {
    const repostNotification = notification as NotificationRow & { data: RepostNotification }
    return new Repost(dnDb, identityDb, repostNotification)
  }
  else if (notification.type == 'save') {
    const saveNotification = notification as NotificationRow & { data: SaveNotification }
    return new Save(dnDb, identityDb, saveNotification)
  }
  else if (notification.type == 'milestone' || notification.type === 'milestone_follower_count') {
    const milestoneNotification = notification as NotificationRow & { data: MilestoneNotification }
    return new Milestone(dnDb, identityDb, milestoneNotification)
  }
  else if (notification.type == 'remix') {
    const remixNotification = notification as NotificationRow & { data: RemixNotification }
    return new Remix(dnDb, identityDb, remixNotification)
  }
  else if (notification.type == 'cosign') {
    const cosignNotification = notification as NotificationRow & { data: CosignRemixNotification }
    return new CosignRemix(dnDb, identityDb, cosignNotification)
  }
  else if (notification.type == 'supporter_rank_up') {
    const supporterRankUpNotification = notification as NotificationRow & { data: SupporterRankUpNotification }
    return new SupporterRankUp(dnDb, identityDb, supporterRankUpNotification)
  }
  else if (notification.type == 'supporting_rank_up') {
    const supportingRankUp = notification as NotificationRow & { data: SupportingRankUpNotification }
    return new SupportingRankUp(dnDb, identityDb, supportingRankUp)
  }
  else if (notification.type == 'supporter_dethroned') {
    const supporterDethronedNotification = notification as NotificationRow & { data: SupporterDethronedNotification }
    return new SupporterDethroned(dnDb, identityDb, supporterDethronedNotification)
  }
  else if (notification.type == 'tip_receive') {
    const tipReceiveNotification = notification as NotificationRow & { data: TipReceiveNotification }
    return new TipReceive(dnDb, identityDb, tipReceiveNotification)
  }
  else if (notification.type == 'tip_send') {
    const tipSendNotification = notification as NotificationRow & { data: TipSendNotification }
    return new TipSend(dnDb, identityDb, tipSendNotification)
  }
  else if (notification.type == 'challenge_reward') {
    const challengeRewardNotification = notification as NotificationRow & { data: ChallengeRewardNotification }
    return new ChallengeReward(dnDb, identityDb, challengeRewardNotification)
  }
  else if (notification.type == 'track_added_to_playlist') {
    const addTrackToPlaylistNotification = notification as NotificationRow & { data: AddTrackToPlaylistNotification }
    return new AddTrackToPlaylist(dnDb, identityDb, addTrackToPlaylistNotification)
  }
  else if (notification.type == 'create') {
    const createNotification = notification as NotificationRow & { data: CreateTrackNotification | CreatePlaylistNotification }
    return new Create(dnDb, identityDb, createNotification)
  }
  else if (notification.type == 'trending') {
    const trendingNotification = notification as NotificationRow & { data: TrendingTrackNotification }
    return new TrendingTrack(dnDb, identityDb, trendingNotification)
  }
  else if (notification.type == 'announcement') {
    const announcementNotification = notification as NotificationRow & { data: AnnouncementNotification }
    return new Announcement(dnDb, identityDb, announcementNotification)
  }
  else if (notification.type == 'reaction') {
    const reactionNotification = notification as NotificationRow & { data: ReactionNotification }
    return new Reaction(dnDb, identityDb, reactionNotification)
  } else if (notification.type == DMEntityType.Message || notification.type == DMEntityType.Reaction) {
    const messageEmailNotification = notification as DMEmailNotification
    return new MessageEmail(dnDb, identityDb, messageEmailNotification)
  }

  logger.info(`Notification type: ${notification.type} has no handler`)
}
