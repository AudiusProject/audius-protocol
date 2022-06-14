const { Base } = require('./base')

class Reactions extends Base {
  constructor (...args) {
    super(...args)
    this.submitReaction = this.submitReaction.bind(this)
  }

  /**
   * Submit a user's reaction
   * (represented by a numberic ID denoting one of 'heart' | 'fire' | 'party' | 'explode')
   * to an entity, e.g. a notification for a received tip.
   *
   * @param {{
   *   reactedTo: string,
   *   reactionValue: number,
   *   logger: any
   * }} {
   *   reactedTo,
   *   reactionValue,
   *   logger
   * }
   * @returns {Promise<{ success: boolean, error: any }>}
   */
  async submitReaction ({ reactedTo, reactionValue, logger = console }) {
    try {
      await this.identityService.submitReaction({
        reactedTo, reactionValue
      })
      logger.info(`Successfully submitted reaction for entity ${reactedTo} and reaction value ${reactionValue}.`)
      return { success: true, error: null }
    } catch (e) {
      const error = e.message
      logger.error(`Could not successfully submit reaction for entity ${reactedTo} and reaction value ${reactionValue}. Error: ${error}`)
      return { success: false, error }
    }
  }
}

module.exports = Reactions
