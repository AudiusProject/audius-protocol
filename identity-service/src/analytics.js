const amplitude = require('amplitude-js')
const config = require('./config')

class AnalyticsProvider {
  constructor () {
    const AMPLITUDE_API_KEY = config.get('amplitudeAPIKey')
    this.amplitudeInstance = amplitude.getInstance()
    try {
      this.amplitudeInstance.init(AMPLITUDE_API_KEY)
    } catch (e) {
      console.log(`Failed to init amplitude with error: ${JSON.stringify(e)}`)
    }
  }

  track (eventName, properties) {
    try {
      this.amplitudeInstance.logEvent(eventName, properties)
    } catch (e) {
      console.log(`Failed to log amplitude event with error: ${e}`)
    }
  }
}

module.exports = AnalyticsProvider
