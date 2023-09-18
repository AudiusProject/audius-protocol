"use strict";
const { SlackReporter } = require('./slackReporter');
const config = require('../config');
const WEBSITE_HOST = config.get('websiteHost');
class VerifiedUserReporter {
    constructor({ slackUrl, source, childLogger = console }) {
        this.reporter = new SlackReporter({ slackUrl, childLogger });
        this.source = source;
        this.childLogger = childLogger;
    }
    async report({ userId, handle }) {
        try {
            const report = {
                userId,
                handle,
                link: `${WEBSITE_HOST}/${handle}`,
                source: this.source
            };
            const message = this.reporter.getJsonSlackMessage(report);
            await this.reporter.postToSlack({ message });
            this.childLogger.info(report, `Verified User Reporter`);
        }
        catch (e) {
            console.error(`Report failure: ${JSON.stringify(e)}`);
        }
    }
}
module.exports = {
    VerifiedUserReporter
};
