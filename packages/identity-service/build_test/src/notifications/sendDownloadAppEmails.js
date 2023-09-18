"use strict";
const path = require('path');
const moment = require('moment-timezone');
const handlebars = require('handlebars');
const models = require('../models');
const { logger } = require('../logging');
const fs = require('fs');
const getEmailTemplate = (path) => handlebars.compile(fs.readFileSync(path).toString());
const downloadAppTemplatePath = path.resolve(__dirname, './emails/downloadMobileApp.html');
const downloadAppTemplate = getEmailTemplate(downloadAppTemplatePath);
async function processDownloadAppEmail(expressApp, audiusLibs) {
    try {
        logger.info(`${new Date()} - processDownloadAppEmail`);
        const sg = expressApp.get('sendgrid');
        if (sg === null) {
            logger.error('sendgrid not configured');
            return;
        }
        // Get all users who have not signed in mobile and not been sent native mobile email within 2 days
        const now = moment();
        const twoDaysAgo = now.clone().subtract(2, 'days').format();
        const fiveDaysAgo = now.clone().subtract(5, 'days').format();
        const emailUsersWalletAddress = await models.UserEvents.findAll({
            attributes: ['walletAddress'],
            where: {
                hasSignedInNativeMobile: false,
                hasSentDownloadAppEmail: false,
                createdAt: {
                    [models.Sequelize.Op.lte]: twoDaysAgo,
                    [models.Sequelize.Op.gt]: fiveDaysAgo
                }
            }
        }).map((x) => x.walletAddress);
        const emailUsers = await models.User.findAll({
            attributes: ['handle', 'walletAddress', 'email', 'isEmailDeliverable'],
            where: { walletAddress: emailUsersWalletAddress }
        });
        logger.debug(`processDownloadAppEmail - ${emailUsers.length} 2 day old users who have not signed in mobile`);
        for (const userToEmail of emailUsers) {
            if (!userToEmail.isEmailDeliverable) {
                logger.info(`Unable to deliver download app email to ${userToEmail.handle} ${userToEmail.email}`);
                continue;
            }
            const userEmail = userToEmail.email;
            const sent = await renderAndSendDownloadAppEmail(sg, userEmail);
            if (sent) {
                await models.sequelize.query(`
          INSERT INTO "UserEvents" ("walletAddress", "hasSentDownloadAppEmail", "createdAt", "updatedAt")
          VALUES (:walletAddress, :hasSentDownloadAppEmail, now(), now())
          ON CONFLICT ("walletAddress")
          DO
            UPDATE SET "hasSentDownloadAppEmail" = :hasSentDownloadAppEmail;
        `, {
                    replacements: {
                        walletAddress: userToEmail.walletAddress,
                        hasSentDownloadAppEmail: true
                    }
                });
            }
        }
    }
    catch (e) {
        logger.error('Error processing download app email notifications');
        logger.error(e);
    }
}
// Master function to render and send email for a given userId
async function renderAndSendDownloadAppEmail(sg, userEmail) {
    try {
        logger.info(`render and send download app email: ${userEmail}`);
        const copyrightYear = new Date().getFullYear().toString();
        const downloadAppHtml = downloadAppTemplate({
            copyright_year: copyrightYear
        });
        const emailParams = {
            from: 'The Audius Team <team@audius.co>',
            to: userEmail,
            bcc: ['forrest@audius.co'],
            html: downloadAppHtml,
            subject: 'Audius Is Better On The Go 📱',
            asm: {
                groupId: 19141 // id of unsubscribe group at https://mc.sendgrid.com/unsubscribe-groups
            }
        };
        // Send email
        await sg.send(emailParams);
        return true;
    }
    catch (e) {
        logger.error(`Error in renderAndSendDownloadAppEmail ${e}`);
        return false;
    }
}
module.exports = { processDownloadAppEmail };
