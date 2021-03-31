import Config from 'react-native-config';
import {UserCollection} from '../../models/Collection';
import Track from '../../models/Track';
import User from '../../models/User';
import {
  Achievement,
  Entity,
  Notification,
  NotificationType,
} from '../../store/notifications/types';

/**
 * Formats a URL name for routing.
 *  Removes reserved URL characters
 *  Replaces white space with -
 *  Lower cases
 * @param name
 */
export const formatUrlName = (name: string) => {
  if (!name) {
    return '';
  }
  return (
    name
      .replace(/!|%|#|\$|&|'|\(|\)|&|\*|\+|,|\/|:|;|=|\?|@|\[|\]/g, '')
      .replace(/\s+/g, '-')
      // Reduce repeated `-` to a single `-`
      .replace(/-+/g, '-')
      .toLowerCase()
  );
};

/**
 * Encodes a formatted URL name for routing.
 * Using window.location will automatically decode
 * the encoded component, so using the above formatUrlName(string) can
 * be used to compare results with the window.location directly.
 * @param name
 */
export const encodeUrlName = (name: string) => {
  return encodeURIComponent(formatUrlName(name));
};

const AUDIUS_URL = Config.AUDIUS_URL;

export const getTrackRoute = (track: Track, fullUrl: boolean = false) => {
  const route = `/${track.route_id}-${track.track_id}`;
  return fullUrl ? `${AUDIUS_URL}${route}` : route;
};

export const getUserRoute = (user: User, fullUrl: boolean = false) => {
  const route = `/${user.handle}`;
  return fullUrl ? `${AUDIUS_URL}${route}` : route;
};

export const getCollectionRoute = (
  collection: UserCollection,
  fullUrl = false,
) => {
  const handle = collection.user.handle;
  const title = collection.playlist_name;
  const id = collection.playlist_id;
  const route = collection.is_album
    ? `/${encodeUrlName(handle)}/album/${encodeUrlName(title)}-${id}`
    : `/${encodeUrlName(handle)}/playlist/${encodeUrlName(title)}-${id}`;
  return fullUrl ? `${AUDIUS_URL}${route}` : route;
};

export const getUserListRoute = (
  notification: Notification,
  fullUrl = false,
) => {
  const route = `/notification/${notification.id}/users`;
  return fullUrl ? `${AUDIUS_URL}${route}` : route;
};

export const getEntityRoute = (
  entity: any,
  entityType: Entity,
  fullUrl: boolean = false,
) => {
  switch (entityType) {
    case Entity.Track:
      return getTrackRoute(entity, fullUrl);
    case Entity.User:
      return getUserRoute(entity, fullUrl);
    case Entity.Album:
    case Entity.Playlist:
      return getCollectionRoute(entity, fullUrl);
  }
};

export const getNotificationRoute = (notification: Notification) => {
  switch (notification.type) {
    case NotificationType.Announcement:
      return null;
    case NotificationType.Follow:
      const users = notification.users;
      const isMultiUser = !!users && users.length > 1;
      if (isMultiUser) {
        return getUserListRoute(notification);
      }
      const firstUser = notification.users[0];
      return getUserRoute(firstUser);
    case NotificationType.UserSubscription:
      return getEntityRoute(notification.entities[0], notification.entityType);
    case NotificationType.Favorite:
      return getEntityRoute(notification.entity, notification.entityType);
    case NotificationType.Repost:
      return getEntityRoute(notification.entity, notification.entityType);
    case NotificationType.Milestone:
      if (notification.achievement === Achievement.Followers) {
        return getUserRoute(notification.user);
      }
      return getEntityRoute(notification.entity, notification.entityType);
    case NotificationType.RemixCosign:
      const original = notification.entities.find(
        (track: Track) => track.owner_id === notification.parentTrackUserId,
      );
      return getEntityRoute(original, Entity.Track);
    case NotificationType.RemixCreate:
      const remix = notification.entities.find(
        (track: Track) => track.track_id === notification.childTrackId,
      );
      return getEntityRoute(remix, Entity.Track);
    case NotificationType.TrendingTrack:
      return getEntityRoute(notification.entity, notification.entityType);
  }
};
