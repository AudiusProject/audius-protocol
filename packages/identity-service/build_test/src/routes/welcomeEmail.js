"use strict";
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers');
const models = require('../models');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../authMiddleware');
const getEmailTemplate = (path) => handlebars.compile(fs.readFileSync(path).toString());
const welcomeTemplatePath = path.resolve(__dirname, '../notifications/emails/welcome.html');
const welcomeTemplate = getEmailTemplate(welcomeTemplatePath);
const welcomeDownloadTemplatePath = path.resolve(__dirname, '../notifications/emails/welcomeDownload.html');
const welcomeDownloadTemplate = getEmailTemplate(welcomeDownloadTemplatePath);
module.exports = function (app) {
    /**
     * Send the welcome email information to the requested account
     */
    app.post('/email/welcome', authMiddleware, handleResponse(async (req, res, next) => {
        const sg = req.app.get('sendgrid');
        if (!sg) {
            req.logger.error('Missing sendgrid api key');
            // Short-circuit if no api key provided, but do not error
            return successResponse({
                msg: 'No sendgrid API Key found',
                status: true
            });
        }
        const { name, isNativeMobile = false } = req.body;
        if (!name) {
            return errorResponseBadRequest('Please provide a name');
        }
        const existingUser = await models.User.findOne({
            where: { id: req.user.id }
        });
        if (!existingUser) {
            return errorResponseBadRequest('Invalid signature provided, no user found');
        }
        if (!existingUser.isEmailDeliverable) {
            req.logger.info(`Unable to deliver welcome email to ${existingUser.handle} ${existingUser.email}`);
            return successResponse({ msg: 'Welcome email forbidden', status: true });
        }
        if (existingUser.isBlockedFromEmails) {
            req.logger.info(`User with handle ${existingUser.handle} and email ${existingUser.email} is blocked from receiving emails`);
            return successResponse({ msg: 'Welcome email forbidden', status: true });
        }
        const walletAddress = existingUser.walletAddress;
        const htmlTemplate = isNativeMobile
            ? welcomeTemplate
            : welcomeDownloadTemplate;
        const copyrightYear = new Date().getFullYear().toString();
        const welcomeHtml = htmlTemplate({
            name,
            copyright_year: copyrightYear
        });
        const emailParams = {
            from: 'The Audius Team <team@audius.co>',
            to: existingUser.email,
            bcc: ['forrest@audius.co'],
            subject: 'The Automated Welcome Email',
            html: welcomeHtml,
            asm: {
                groupId: 19141 // id of unsubscribe group at https://mc.sendgrid.com/unsubscribe-groups
            }
        };
        try {
            await sg.send(emailParams);
            await models.sequelize.query(`
          INSERT INTO "UserEvents" ("walletAddress", "hasSignedInNativeMobile", "createdAt", "updatedAt")
          VALUES (:walletAddress, :hasSignedInNativeMobile, now(), now())
          ON CONFLICT ("walletAddress")
          DO
            UPDATE SET "hasSignedInNativeMobile" = :hasSignedInNativeMobile;
        `, {
                replacements: {
                    walletAddress,
                    hasSignedInNativeMobile: isNativeMobile
                }
            });
            return successResponse({ status: true });
        }
        catch (e) {
            console.log(e);
            return errorResponseServerError(e);
        }
    }));
};
