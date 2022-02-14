const axios = require('axios')
const AnalyticsProvider = require('../analytics')

const RewardEventNames = {
  REWARDS_CLAIM_SUCCESS: 'Rewards Claim: Success',
  REWARDS_CLAIM_FAILURE: 'Rewards Claim: Failure',
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
    source
  }) {
    this.successReporter = new SlackReporter({ slackUrl: successSlackUrl, childLogger })
    this.errorReporter = new SlackReporter({ slackUrl: errorSlackUrl, childLogger })
    this.analyticsProvider = new AnalyticsProvider()
    this.childLogger = childLogger
    this.source = source
  }

  async reportSuccess ({ userId, challengeId, amount, specifier }) {
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
    this.analyticsProvider.track(RewardEventNames.REWARDS_CLAIM_SUCCESS, {
      userId,
      challengeId,
      amount,
      specifier,
      source: this.source
    })
  }

  async reportFailure ({ userId, challengeId, amount, error, phase, specifier }) {
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
    this.analyticsProvider.track(RewardEventNames.REWARDS_CLAIM_FAILURE, {
      userId,
      challengeId,
      amount,
      specifier,
      error,
      phase,
      source: this.source
    })
  }

  async reportAAORejection ({ userId, challengeId, amount, error, specifier }) {
    const report = {
      status: 'rejection',
      userId,
      challengeId,
      amount: amount.toString(),
      error: error.toString(),
      source: this.source,
      specifier
    }
    const slackMessage = this.errorReporter.getJsonSlackMessage(report)
    await this.errorReporter.postToSlack({ message: slackMessage })
    this.childLogger.info(report, `Rewards Reporter`)
    this.analyticsProvider.track(RewardEventNames.REWARDS_CLAIM_BLOCKED, {
      userId,
      challengeId,
      amount,
      specifier,
      error,
      source: this.source
    })
  }
}

module.exports = {
  SlackReporter,
  RewardsReporter
}
