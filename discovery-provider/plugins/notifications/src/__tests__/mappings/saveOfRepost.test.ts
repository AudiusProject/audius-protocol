import { expect, jest, test } from "@jest/globals";
import { Processor } from "../../main";
import * as sns from "../../sns";

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createReposts,
  createTracks,
  insertFollows,
  createPlaylists,
  createSaves,
  resetTests,
  setUpTestDbProcessor
} from "../../utils/populateDB";

import { AppEmailNotification } from "../../types/notifications";
import { renderEmail } from "../../email/notifications/renderEmail";
import { EntityType } from "../../email/notifications/types";

describe("Save Of Repost Notification", () => {
  let processor: Processor;

  const sendPushNotificationSpy = jest
    .spyOn(sns, "sendPushNotification")
    .mockImplementation(() => Promise.resolve());

  beforeEach(async () => {
    processor = await setUpTestDbProcessor();
  });

  afterEach(async () => {
    await resetTests(processor);
  });

  const createEntityToRepost = async (entityType) => {
    switch (entityType) {
      case EntityType.Track:
        await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }]);
        break;
      case EntityType.Playlist:
        await createPlaylists(processor.discoveryDB, [{ playlist_id: 10, playlist_owner_id: 1 }]);
        break;
      case EntityType.Album:
        await createPlaylists(processor.discoveryDB, [{ playlist_id: 10, playlist_owner_id: 1 }]);
        break;
      default:
        break
    }
  }

  const setUpSaveOfRepostMockData = async (entityType) => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 },
    ]);
    await insertFollows(processor.discoveryDB, [{ follower_user_id: 3, followee_user_id: 2 }])
    await createEntityToRepost(entityType);
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 10,
        repost_type: entityType,
      }
    ]);
    await createSaves(processor.discoveryDB, [
      {
        user_id: 3,
        save_item_id: 10,
        save_type: entityType,
        is_save_of_repost: true,
      }
    ]);
  }

  test("Process push notification for save of repost track", async () => {
    await setUpSaveOfRepostMockData(EntityType.Track)
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const pending = processor.listener.takePending();
    expect(pending?.appNotifications).toHaveLength(4);
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications);
    console.log(sendPushNotificationSpy.mock.calls)
    expect(sendPushNotificationSpy).toHaveBeenLastCalledWith(
      {
        type: "ios",
        targetARN: "arn:2",
        badgeCount: 0,
      },
      {
        title: "New Favorite",
        body: "user_3 favorited your repost of track_title_10",
        data: {},
      }
    );
  });

  test("Process push notification for save of repost playlist", async () => {
    setUpSaveOfRepostMockData(EntityType.Playlist)
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const pending = processor.listener.takePending();
    expect(pending?.appNotifications).toHaveLength(4);
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications);
    expect(sendPushNotificationSpy).toHaveBeenLastCalledWith(
      {
        type: "ios",
        targetARN: "arn:2",
        badgeCount: 0,
      },
      {
        title: "New Favorite",
        body: "user_3 favorited your repost of playlist_name_10",
        data: {},
      }
    );
  });

  test("Process push notification for repost of album", async () => {
    setUpSaveOfRepostMockData(EntityType.Album)
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const pending = processor.listener.takePending();
    expect(pending?.appNotifications).toHaveLength(4);
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications);
    expect(sendPushNotificationSpy).toHaveBeenLastCalledWith(
      {
        type: "ios",
        targetARN: "arn:2",
        badgeCount: 0,
      },
      {
        title: "New Favorite",
        body: "user_3 favorited your repost of playlist_name_10",
        data: {},
      }
    );
  });

  test("Render a single email", async () => {
    setUpSaveOfRepostMockData(EntityType.Playlist)
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }]);
    await new Promise((resolve) => setTimeout(resolve, 10));

    const notifications: AppEmailNotification[] = [
      {
        type: "save_of_repost",
        timestamp: new Date(),
        specifier: "3",
        group_id: "save_of_repost:10:type:playlist",
        data: {
          type: EntityType.Playlist,
          user_id: 3,
          save_of_repost_item_id: 10,
        },
        user_ids: [2],
        receiver_user_id: 2,
      },
    ];
    const notifHtml = await renderEmail({
      userId: 2,
      email: "joey@audius.co",
      frequency: "daily",
      notifications,
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB,
    });
    expect(notifHtml).toMatchSnapshot();
  });
});
