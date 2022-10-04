const axios = require('axios')

class SlackReporter {
  constructor({ slackUrl, childLogger }) {
    this.slackUrl = slackUrl
    this.childLogger = childLogger
  }

  getJsonSlackMessage(obj) {
    return `\`\`\`
${Object.entries(obj)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}
\`\`\``
  }

  async postToSlack({ message }) {
    try {
      if (!this.slackUrl) return
      await axios.post(this.slackUrl, { text: message })
    } catch (e) {
      this.childLogger.info(
        `Error posting to slack in slack reporter ${e.toString()}`
      )
    }
  }
}

module.exports = {
  SlackReporter
}
