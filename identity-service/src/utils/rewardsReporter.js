const axios = require('axios')

const getJsonSlackMessage = (obj) => `\`\`\`
Source: Identity
${Object.entries(obj).map(([key, value]) => `${key}: ${value}`).join('\n')}
\`\`\``

class RewardsReporter {
  constructor ({
    slackUrl,
    childLogger
  }) {
    this.slackUrl = slackUrl
    this.childLogger = childLogger
  }

  async reportSuccess ({ userId, challengeId, amount }) {
    const slackMessage = getJsonSlackMessage({
      status: 'success',
      userId,
      challengeId,
      amount: amount.toString()
    })
    await this.postToSlack({ slackUrl: this.slackUrl, message: slackMessage })
    this.childLogger.info({ status: 'success', userId, challengeId, amount: amount.toString() }, `Rewards Reporter`)
  }

  async reportFailure ({ userId, challengeId, amount, error, phase }) {
    const slackMessage = getJsonSlackMessage({
      status: 'failure',
      userId,
      challengeId,
      amount: amount.toString(),
      error: error.toString(),
      phase
    })
    await this.postToSlack({ slackUrl: this.slackUrl, message: slackMessage })
    this.childLogger.info({ status: 'failure', userId, challengeId, amount: amount.toString(), error, phase }, `Rewards Reporter`)
  }

  async reportAAORejection ({ userId, challengeId, amount, error }) {
    const slackMessage = getJsonSlackMessage({
      status: 'rejection',
      userId,
      challengeId,
      amount: amount.toString(),
      error: error.toString()
    })
    await this.postToSlack({ slackUrl: this.slackUrl, message: slackMessage })
    this.childLogger.info({ status: 'rejection', userId, challengeId, amount: amount.toString(), error }, `Rewards Reporter`)
  }

  async postToSlack ({
    slackUrl,
    message
  }) {
    if (!slackUrl) return
    await axios.post(slackUrl, { text: message })
  }
}

module.exports = {
  RewardsReporter
}
