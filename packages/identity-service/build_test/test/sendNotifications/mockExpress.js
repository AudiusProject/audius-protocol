"use strict";
const mockExpressApp = {
    get: (resource) => {
        switch (resource) {
            case 'announcements': {
                return [];
            }
            case 'sendgrid': {
                return {
                    send: async (_) => {
                        return 'body';
                    }
                };
            }
            default:
                return undefined;
        }
    }
};
module.exports = mockExpressApp;
