import { WebClient } from '@slack/web-api'

const SLACK_ENABLED = process.env.SLACK_ENABLED || false

const Slack = () => {
  const { SLACK_TOKEN } = process.env
  const web = new WebClient(SLACK_TOKEN)
  return {
    sendMsg: async (channel, header, body) => {
      const msg = `${header} ${formatter(body)}`
      if (!SLACK_ENABLED) {
        // for debugging
        console.log({ msg }, 'slack not enabled')
        return
      }
      await web.chat
        .postMessage({
          text: msg,
          channel
        })
        .catch(console.error)
    }
  }
}

const formatter = (data) => {
  const msg = []
  for (const [key, value] of Object.entries(data)) {
    // omit any null entries of the track
    if (value != null) {
      msg.push(`${key}: ${value}`)
    }
  }
  const inner = msg.join('\n')
  return '```' + inner + '```'
}

export const slack = Slack()
