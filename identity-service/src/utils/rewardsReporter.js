const axios = require('axios')
const AnalyticsProvider = require('../analytics')

const RewardEventNames = {
  REWARDS_CLAIM_SUCCESS: 'Rewards Claim: Success',
  REWARDS_CLAIM_RETRY: 'Rewards Claim: Retry',
  REWARDS_CLAIM_FAILURE: 'Rewards Claim: Failure',
  REWARDS_CLAIM_HCAPTCHA: 'Rewards Claim: Hcaptcha',
  REWARDS_CLAIM_COGNITO: 'Rewards Claim: Cognito',
  REWARDS_CLAIM_OTHER: 'Rewards Claim: Other',
  REWARDS_CLAIM_BLOCKED: 'Rewards Claim: Blocked'
}

class SlackReporter {
  constructor ({
    slackUrl,
    childLogger
  }) {
    this.slackUrl = slackUrl
    this.childLogger = childLogger
  }

  getJsonSlackMessage (obj) {
    return `\`\`\`
${Object.entries(obj).map(([key, value]) => `${key}: ${value}`).join('\n')}
\`\`\``
  }

  async postToSlack ({
    message
  }) {
    try {
      if (!this.slackUrl) return
      await axios.post(this.slackUrl, { text: message })
    } catch (e) {
      this.childLogger.info(`Error posting to slack in slack reporter ${e.toString()}`)
    }
  }
}

class RewardsReporter {
  constructor ({
    successSlackUrl,
    errorSlackUrl,
    childLogger = console,
    source,
    shouldReportAnalytics = true
  }) {
    this.successReporter = new SlackReporter({ slackUrl: successSlackUrl, childLogger })
    this.errorReporter = new SlackReporter({ slackUrl: errorSlackUrl, childLogger })
    this.analyticsProvider = new AnalyticsProvider()
    this.childLogger = childLogger
    this.source = source
    this.shouldReportAnalytics = shouldReportAnalytics
  }

  async reportSuccess ({ userId, challengeId, amount, specifier }) {
    try {
      const report = {
        status: 'success',
        userId,
        challengeId,
        amount: amount.toString(),
        source: this.source,
        specifier
      }
      const slackMessage = this.successReporter.getJsonSlackMessage(report)
      await this.successReporter.postToSlack({ message: slackMessage })
      this.childLogger.info(report, `Rewards Reporter`)

      if (this.shouldReportAnalytics) {
        this.analyticsProvider.track(RewardEventNames.REWARDS_CLAIM_SUCCESS, userId, {
          userId,
          challengeId,
          amount,
          specifier,
          source: this.source
        })
      }
    } catch (e) {
      console.error(`Report success failure: ${JSON.stringify(e)}`)
    }
  }

  async reportRetry ({ userId, challengeId, amount, error, phase, specifier }) {
    try {
      const report = {
        status: 'retry',
        userId,
        challengeId,
        amount: amount.toString(),
        error: error.toString(),
        phase,
        source: this.source,
        specifier
      }
      const slackMessage = this.errorReporter.getJsonSlackMessage(report)
      await this.errorReporter.postToSlack({ message: slackMessage })
      this.childLogger.info(report, `Rewards Reporter`)

      if (this.shouldReportAnalytics) {
        this.analyticsProvider.track(RewardEventNames.REWARDS_CLAIM_RETRY, userId, {
          userId,
          challengeId,
          amount,
          specifier,
          error,
          phase,
          source: this.source
        })
      }
    } catch (e) {
      console.error(`Report retry error: ${JSON.stringify(e)}`)
    }
  }

  async reportFailure ({ userId, challengeId, amount, error, phase, specifier }) {
    try {
      const report = {
        status: 'failure',
        userId,
        challengeId,
        amount: amount.toString(),
        error: error.toString(),
        phase,
        source: this.source,
        specifier
      }
      const slackMessage = this.errorReporter.getJsonSlackMessage(report)
      await this.errorReporter.postToSlack({ message: slackMessage })
      this.childLogger.info(report, `Rewards Reporter`)

      if (this.shouldReportAnalytics) {
        this.analyticsProvider.track(RewardEventNames.REWARDS_CLAIM_FAILURE, userId, {
          userId,
          challengeId,
          amount,
          specifier,
          error,
          phase,
          source: this.source
        })
      }
    } catch (e) {
      console.error(`Report failure error: ${JSON.stringify(e)}`)
    }
  }

  async reportAAORejection ({ userId, challengeId, amount, error, specifier, reason }) {
    try {
      const report = {
        status: 'rejection',
        userId,
        challengeId,
        amount: amount.toString(),
        error: error.toString(),
        source: this.source,
        specifier,
        reason
      }
      this.childLogger.info(report, `Rewards Reporter`)

      if (this.shouldReportAnalytics) {
        const event = {
          'hcaptcha': RewardEventNames.REWARDS_CLAIM_HCAPTCHA,
          'cognito': RewardEventNames.REWARDS_CLAIM_COGNITO,
          'other': RewardEventNames.REWARDS_CLAIM_OTHER,
          'blocked': RewardEventNames.REWARDS_CLAIM_BLOCKED
        }[reason] || RewardEventNames.REWARDS_CLAIM_BLOCKED
        this.analyticsProvider.track(event, userId, {
          userId,
          challengeId,
          amount,
          specifier,
          error,
          source: this.source
        })
      }
    } catch (e) {
      console.error(`Report rejection error: ${JSON.stringify(e)}`)
    }
  }
}

module.exports = {
  SlackReporter,
  RewardsReporter
}
