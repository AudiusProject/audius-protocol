"use strict";
const assert = require('assert');
const models = require('../../src/models');
const getEmailNotifications = require('../../src/notifications/fetchNotificationMetadata.js');
const { processTrendingTracks } = require('../../src/notifications/trendingTrackProcessing');
const renderEmail = require('../../src/notifications/renderEmail');
const { clearDatabase, runMigrations } = require('../lib/app');
// Mock Notifications
const trendingTrack = require('./mockNotifications/trendingTrack.json');
const mockAudiusLibs = require('./mockLibs');
describe('Test Get Email Notifications', function () {
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
    });
    it('should have the correct email props for an email notifications', async function () {
        const tx1 = await models.sequelize.transaction();
        await processTrendingTracks(null, 1, trendingTrack, tx1);
        await tx1.commit();
        const userId = 1;
        // Check that the email props can be generated correctly
        const [notificationProps] = await getEmailNotifications(mockAudiusLibs, userId);
        assert.ok(notificationProps);
        const renderProps = {
            title: 'email title',
            subject: 'subject',
            notifications: notificationProps
        };
        // Check that the email renders correctly
        const notifHtml = renderEmail(renderProps);
        assert.ok(notifHtml);
    });
});
