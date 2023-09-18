"use strict";
const assert = require('assert');
const moment = require('moment');
const sinon = require('sinon');
const models = require('../../src/models');
const processNotifications = require('../../src/notifications/processNotifications/index.js');
const { clearDatabase, runMigrations } = require('../lib/app');
const notificationUtils = require('../../src/notifications/utils');
const sendNotificationEmails = require('../../src/notifications/sendNotificationEmails');
const { EmailFrequency, MAX_HOUR_TIME_DIFFERENCE } = notificationUtils;
// Mock Notifications
const mockNotification = [
    {
        blocknumber: 1,
        initiator: 2,
        metadata: {
            followee_user_id: 1,
            follower_user_id: 2
        },
        timestamp: moment().format('YYYY-MM-DDTHH:mm:ss') + ' Z',
        type: 'Follow'
    }
];
const mockExpressApp = require('./mockExpress');
const mockLibs = require('./mockLibs');
const { processEmailNotifications } = sendNotificationEmails;
let sandbox;
describe('Test Send Notification Emails', function () {
    before(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(notificationUtils, 'shouldSendEmail')
            .returns(true);
    });
    after(() => {
        sandbox.restore();
    });
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
    });
    it('should have send the correct notification emails for a live user', async function () {
        // Create a user
        await models.User.create({
            blockchainUserId: 1,
            email: 'test@test.com',
            isConfigured: true,
            lastSeenDate: moment().format('YYYY-MM-DDTHH:mm:ss')
        });
        // Create a user notification setting
        await models.UserNotificationSettings.create({
            userId: 1,
            emailFrequency: EmailFrequency.LIVE
        });
        const tx1 = await models.sequelize.transaction();
        // This method puts the notifications in the db
        await processNotifications(mockNotification, tx1);
        await tx1.commit();
        await processEmailNotifications(mockExpressApp, mockLibs);
        const userEmail = await models.NotificationEmail.findOne({ where: { userId: 1, emailFrequency: EmailFrequency.LIVE } });
        assert.strictEqual(!!userEmail, true);
    });
    it('should have send the correct notification emails for a daily user', async function () {
        // Create a user
        await models.User.create({
            blockchainUserId: 1,
            email: 'test@test.com',
            isConfigured: true,
            lastSeenDate: moment().format('YYYY-MM-DDTHH:mm:ss')
        });
        // Create a user notification setting
        await models.UserNotificationSettings.create({
            userId: 1,
            emailFrequency: EmailFrequency.DAILY
        });
        const tx1 = await models.sequelize.transaction();
        // This method puts the notifications in the db
        await processNotifications(mockNotification, tx1);
        await tx1.commit();
        await processEmailNotifications(mockExpressApp, mockLibs);
        const userEmail = await models.NotificationEmail.findOne({ where: { userId: 1, emailFrequency: EmailFrequency.DAILY } });
        assert.strictEqual(!!userEmail, true);
    });
    it('should have send the correct notification emails for a weekly user', async function () {
        // Create a user
        await models.User.create({
            blockchainUserId: 1,
            email: 'test@test.com',
            isConfigured: true,
            lastSeenDate: moment().format('YYYY-MM-DDTHH:mm:ss')
        });
        // Create a user notification setting
        await models.UserNotificationSettings.create({
            userId: 1,
            emailFrequency: EmailFrequency.WEEKLY
        });
        const tx1 = await models.sequelize.transaction();
        // This method puts the notifications in the db
        await processNotifications(mockNotification, tx1);
        await tx1.commit();
        await processEmailNotifications(mockExpressApp, mockLibs);
        const userEmail = await models.NotificationEmail.findOne({ where: { userId: 1, emailFrequency: EmailFrequency.WEEKLY } });
        assert.strictEqual(!!userEmail, true);
    });
    it('should not error email flow if error in sending email', async function () {
        // Create a user
        await models.User.create({
            blockchainUserId: 1,
            email: 'test@test.com',
            isConfigured: true,
            lastSeenDate: moment().format('YYYY-MM-DDTHH:mm:ss')
        });
        // Create a user notification setting
        await models.UserNotificationSettings.create({
            userId: 1,
            emailFrequency: EmailFrequency.WEEKLY
        });
        const tx1 = await models.sequelize.transaction();
        // This method puts the notifications in the db
        await processNotifications(mockNotification, tx1);
        await tx1.commit();
        const mockExpressWithFailedMg = {
            get: (resource) => {
                switch (resource) {
                    case 'announcements': {
                        return [];
                    }
                    case 'sendgrid': {
                        return {
                            send: async (_) => {
                                throw new Error('failed to send email');
                            }
                        };
                    }
                    default:
                        return undefined;
                }
            }
        };
        await processEmailNotifications(mockExpressWithFailedMg, mockLibs);
        const userEmail = await models.NotificationEmail.findOne({ where: { userId: 1, emailFrequency: EmailFrequency.WEEKLY } });
        assert.strictEqual(!!userEmail, false);
    });
});
describe('Test Should Send Email Emails', function () {
    it('should not send if email frequency is off', async function () {
        const currentUtcTime = moment();
        const lastSentTimestamp = moment();
        const hrSinceStartOfDay = 10;
        const shouldSend = notificationUtils.shouldSendEmail(EmailFrequency.OFF, currentUtcTime, lastSentTimestamp, hrSinceStartOfDay);
        assert.strictEqual(shouldSend, false);
    });
    it('should send if email frequency is live', async function () {
        const currentUtcTime = moment();
        const lastSentTimestamp = moment();
        const hrSinceStartOfDay = 10;
        const shouldSend = notificationUtils.shouldSendEmail(EmailFrequency.LIVE, currentUtcTime, lastSentTimestamp, hrSinceStartOfDay);
        assert.strictEqual(shouldSend, true);
    });
    it('should not send if email frequency is daily and last sent it < a day', async function () {
        const currentUtcTime = moment();
        const lastSentTimestamp = moment().subtract(12, 'hours');
        const hrSinceStartOfDay = MAX_HOUR_TIME_DIFFERENCE - 1;
        const shouldSend = notificationUtils.shouldSendEmail(EmailFrequency.DAILY, currentUtcTime, lastSentTimestamp, hrSinceStartOfDay);
        assert.strictEqual(shouldSend, false);
    });
    it('should send if email frequency is daily and last sent it > a day', async function () {
        const currentUtcTime = moment();
        const lastSentTimestamp = moment().subtract(25, 'hours');
        const hrSinceStartOfDay = MAX_HOUR_TIME_DIFFERENCE - 1;
        const shouldSend = notificationUtils.shouldSendEmail(EmailFrequency.DAILY, currentUtcTime, lastSentTimestamp, hrSinceStartOfDay);
        assert.strictEqual(shouldSend, true);
    });
    it('should not send if email frequency is weekly and last sent it < a week', async function () {
        const currentUtcTime = moment();
        const lastSentTimestamp = moment().subtract(48, 'hours');
        const hrSinceStartOfDay = MAX_HOUR_TIME_DIFFERENCE - 1;
        const shouldSend = notificationUtils.shouldSendEmail(EmailFrequency.WEEKLY, currentUtcTime, lastSentTimestamp, hrSinceStartOfDay);
        assert.strictEqual(shouldSend, false);
    });
    it('should send if email frequency is weekly and last sent it > a day', async function () {
        const currentUtcTime = moment();
        const lastSentTimestamp = moment().subtract(200, 'hours');
        const hrSinceStartOfDay = MAX_HOUR_TIME_DIFFERENCE - 1;
        const shouldSend = notificationUtils.shouldSendEmail(EmailFrequency.WEEKLY, currentUtcTime, lastSentTimestamp, hrSinceStartOfDay);
        assert.strictEqual(shouldSend, true);
    });
});
