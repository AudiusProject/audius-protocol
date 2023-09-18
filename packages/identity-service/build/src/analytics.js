"use strict";
const amplitude = require('@amplitude/node');
const config = require('./config');
class AnalyticsProvider {
    constructor() {
        const AMPLITUDE_API_KEY = config.get('amplitudeAPIKey');
        try {
            this.amplitudeInstance = amplitude.init(AMPLITUDE_API_KEY);
        }
        catch (e) {
            console.log(`Failed to init amplitude with error: ${JSON.stringify(e)}`);
        }
    }
    async track(eventName, userId, properties) {
        try {
            await this.amplitudeInstance.logEvent({
                event_type: eventName,
                event_properties: properties,
                user_id: `${userId}`
            });
        }
        catch (e) {
            console.log(`Failed to log amplitude event with error: ${e}`);
        }
    }
}
module.exports = AnalyticsProvider;
