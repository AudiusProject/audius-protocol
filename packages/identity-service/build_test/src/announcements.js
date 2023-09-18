"use strict";
const axios = require('axios');
const moment = require('moment');
const config = require('./config.js');
module.exports.fetchAnnouncements = async () => {
    const audiusNotificationUrl = config.get('audiusNotificationUrl');
    const response = await axios.get(`${audiusNotificationUrl}/index.json`);
    if (response.data && Array.isArray(response.data.notifications)) {
        const announcementsResponse = await Promise.all(response.data.notifications.map(async (notification) => {
            const notificationResponse = await axios.get(`${audiusNotificationUrl}/${notification.id}.json`);
            return notificationResponse.data;
        }));
        const announcements = announcementsResponse
            .filter((a) => !!a.entityId)
            .map((a) => ({ ...a, type: 'Announcement' }));
        announcements.sort((a, b) => {
            const aDate = moment(a.datePublished);
            const bDate = moment(b.datePublished);
            return bDate - aDate;
        });
        const announcementMap = announcements.reduce((acc, a) => {
            acc[a.entityId] = a;
            return acc;
        }, {});
        return { announcements, announcementMap };
    }
};
