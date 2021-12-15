const axios = require('axios')

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
Source: Identity
${Object.entries(obj).map(([key, value]) => `${key}: ${value}`).join('\n')}
\`\`\``
  }

  async postToSlack ({
    message
  }) {
    if (!this.slackUrl) return
    await axios.post(this.slackUrl, { text: message })
  }
}

class RewardsReporter extends SlackReporter {
  async reportSuccess ({ userId, challengeId, amount }) {
    const slackMessage = this.getJsonSlackMessage({
      status: 'success',
      userId,
      challengeId,
      amount: amount.toString()
    })
    await this.postToSlack({ message: slackMessage })
    this.childLogger.info({ status: 'success', userId, challengeId, amount: amount.toString() }, `Rewards Reporter`)
  }

  async reportFailure ({ userId, challengeId, amount, error, phase }) {
    const slackMessage = this.getJsonSlackMessage({
      status: 'failure',
      userId,
      challengeId,
      amount: amount.toString(),
      error: error.toString(),
      phase
    })
    await this.postToSlack({ message: slackMessage })
    this.childLogger.info({ status: 'failure', userId, challengeId, amount: amount.toString(), error, phase }, `Rewards Reporter`)
  }

  async reportAAORejection ({ userId, challengeId, amount, error }) {
    const slackMessage = this.getJsonSlackMessage({
      status: 'rejection',
      userId,
      challengeId,
      amount: amount.toString(),
      error: error.toString()
    })
    await this.postToSlack({ message: slackMessage })
    this.childLogger.info({ status: 'rejection', userId, challengeId, amount: amount.toString(), error }, `Rewards Reporter`)
  }
}

module.exports = {
  SlackReporter,
  RewardsReporter
}
