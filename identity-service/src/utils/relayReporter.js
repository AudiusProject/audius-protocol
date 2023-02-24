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

    async reportStart({ chain, userId, contractAddress, nethermindContractAddress, senderAddress }) {
        await this.report({ eventName: eventName('Start', chain), userId, data: {
            contractAddress, 
            nethermindContractAddress,
            senderAddress
        } })
    }

    async reportSuccess({ chain, userId, totalTime, txSubmissionTime, contractAddress, nethermindContractAddress, senderAddress }) {
        await this.report({ eventName: eventName('Success', chain), userId, data: {
            totalTime,
            txSubmissionTime,
            contractAddress, 
            nethermindContractAddress,
            senderAddress
        } })
    }

    async reportError({ chain, userId, totalTime, txSubmissionTime, contractAddress, nethermindContractAddress, senderAddress, errMsg }) {
        await this.report({ eventName: eventName('Error', chain), userId, data: {
            totalTime,
            txSubmissionTime,
            contractAddress, 
            nethermindContractAddress,
            senderAddress,
            errMsg
        } })
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
