"use strict";
const assert = require('assert');
const sinon = require('sinon');
const { logger } = require('../../src/logging');
const notifQueue = require('../../src/notifications/notificationQueue');
const NUM_NOTIFS = 50;
describe('Test Drain Notifications', function () {
    before(() => {
        sinon.stub(notifQueue, 'processNotification').returns({});
    });
    beforeEach(async () => {
        notifQueue.pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER = Array.apply(null, Array(NUM_NOTIFS))
            .map(() => ({ types: [] }));
    });
    it('should drain all notifications from queue', async function () {
        assert(notifQueue.pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER.length == NUM_NOTIFS);
        await notifQueue.drainPublishedMessages(logger);
        assert(notifQueue.pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER.length == 0);
    });
});
