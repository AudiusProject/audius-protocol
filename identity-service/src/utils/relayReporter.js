const AnalyticsProvider = require('../analytics')

// "Relay POA: Start" for example
const eventName = (chain, event) => (`Relay ${chain}: ${event}`)

module.exports = class RelayReporter {
    constructor({
        shouldReportAnalytics = true,
        childLogger = console,
    }) {
        this.childLogger = childLogger
        this.shouldReportAnalytics = shouldReportAnalytics
        this.analyticsProvider = new AnalyticsProvider()
    }

    async reportStart({ chain, userId, totalTime, txSubmissionTime, contractAddress,  }) {
        await this.report({ eventName: eventName('Start', chain), userId, data: {} })
    }

    async reportSuccess({ chain, userId }) {
        await this.report({ eventName: eventName('Success', chain), userId, data: {} })
    }

    async reportError({ chain, userId }) {
        await this.report({ eventName: eventName('Error', chain), userId, data: {} })
    }

    async report({ eventName, userId, data }) {
        try {
            if (this.shouldReportAnalytics) {
                this.analyticsProvider.track(
                    eventName,
                    userId,
                    data
                )
            }
        } catch (e) {
            console.error(`RelayReporter error: ${JSON.stringify(e)}`)
        }
    }
}
