import { Base } from './base'

export class Reactions extends Base {
  constructor(...args: any[]) {
    super(...args)
    this.submitReaction = this.submitReaction.bind(this)
  }

  /**
   * Submit a user's reaction, represented by a numberic ID,
   * to an entity e.g. a notification for a received tip.
   */
  async submitReaction({
    reactedTo,
    reactionValue,
    logger = console
  }: {
    reactedTo: string
    reactionValue: number
    logger: any
  }): Promise<{ success: boolean; error: string | null }> {
    try {
      await this['identityService'].submitReaction({
        reactedTo,
        reactionValue
      })
      logger.info(
        `Successfully submitted reaction for entity ${reactedTo} and reaction value ${reactionValue}.`
      )
      return { success: true, error: null }
    } catch (e) {
      const errorMessage = (e as Error).message
      logger.error(
        `Could not successfully submit reaction for entity ${reactedTo} and reaction value ${reactionValue}. Error: ${errorMessage}`
      )
      return { success: false, error: errorMessage }
    }
  }
}
