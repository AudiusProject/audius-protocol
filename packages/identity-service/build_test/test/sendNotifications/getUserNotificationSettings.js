"use strict";
const assert = require('assert');
const { getUserNotificationSettings } = require('../../src/notifications/sendNotifications/index');
const models = require('../../src/models');
const { clearDatabase, runMigrations } = require('../lib/app');
describe('Test Get User Notification Settings', function () {
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
    });
    it('should get the correct object with the user notifcation settings', async function () {
        await models.UserNotificationMobileSettings.bulkCreate([
            { userId: 1 },
            { userId: 2 },
            { userId: 3 },
            { userId: 4 }
        ]);
        await models.NotificationDeviceToken.bulkCreate([
            { userId: 1, deviceToken: '1', deviceType: 'ios' },
            { userId: 2, deviceToken: '2', deviceType: 'android' },
            { userId: 3, deviceToken: '3', deviceType: 'safari' }
        ]);
        await models.UserNotificationBrowserSettings.bulkCreate([
            { userId: 1 },
            { userId: 2 },
            { userId: 3 },
            { userId: 4 }
        ]);
        await models.NotificationBrowserSubscription.bulkCreate([
            { userId: 4, endpoint: 'endpoint2', p256dhKey: 'key', authKey: 'auth' }
        ]);
        const tx1 = await models.sequelize.transaction();
        const userIds = [1, 2, 3, 4];
        const settings = await getUserNotificationSettings(userIds, tx1);
        await tx1.commit();
        console.log(JSON.stringify(settings, null, ' '));
        assert.ok(settings['1'].mobile);
        assert.ok(!settings['1'].browser);
        assert.ok(settings['2'].mobile);
        assert.ok(!settings['2'].browser);
        assert.ok(!settings['3'].mobile);
        assert.ok(settings['3'].browser);
        assert.ok(!settings['4'].mobile);
        assert.ok(settings['4'].browser);
    });
});
