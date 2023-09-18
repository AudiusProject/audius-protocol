"use strict";
const { handleResponse, successResponse, errorResponseBadRequest, errorResponse } = require('../apiHelpers');
const models = require('../models');
const { logger } = require('../logging');
const { getDeviceIDCountForUserId } = require('../utils/fpHelpers');
module.exports = function (app) {
    app.post('/fp/webhook', handleResponse(async (req) => {
        const { visitorId, linkedId: userId, requestId, tag } = req.body;
        logger.info(`Received FP webhook: visitorId ${visitorId}, userId ${userId}, requestId: ${requestId}`);
        const origin = tag && tag.origin;
        if (!origin || !visitorId || !userId || !requestId) {
            logger.error(`Invalid arguments to /fp/webhook: ${req.body}`);
            // Return 200 so webhook doesn't retry
            return successResponse();
        }
        const now = Date.now();
        try {
            await models.Fingerprints.create({
                userId,
                visitorId,
                origin,
                createdAt: now,
                updatedAt: now
            });
        }
        catch (e) {
            logger.error(`Error persisting fingerprint for userId: ${userId}: ${e}`);
        }
        return successResponse();
    }));
    app.get('/fp', handleResponse(async (req) => {
        const { userId, origin } = req.query;
        if (!userId || !origin || !['web', 'mobile', 'desktop'].includes(origin))
            return errorResponseBadRequest();
        try {
            const count = (await models.Fingerprints.findAll({
                where: {
                    userId,
                    origin
                }
            })).length;
            return successResponse({ count });
        }
        catch (e) {
            return errorResponse(`Something went wrong fetching fingerprint for user ${userId}: ${JSON.stringify(e)}`);
        }
    }));
    app.get('/fp/counts/:userId', handleResponse(async (req) => {
        const userId = req.params.userId;
        try {
            const counts = await getDeviceIDCountForUserId(userId);
            return successResponse({ counts });
        }
        catch (e) {
            return errorResponse(`Something went wrong fetching fp counts: ${JSON.stringify(e)}`);
        }
    }));
};
