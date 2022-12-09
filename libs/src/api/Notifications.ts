import type { TransactionReceipt } from 'web3-core'
import {
  Action,
  EntityType
} from '../services/dataContracts/EntityManagerClient'
import { Base, BaseConstructorArgs } from './base'

export class Notifications extends Base {
  constructor(...args: BaseConstructorArgs) {
    super(...args)
    this.viewNotification = this.viewNotification.bind(this)
  }

  /**
   * Submit a user's view of notification event
   */
  async viewNotification({
    logger = console
  }: {
    logger: any
  }): Promise<{ txReceipt?: TransactionReceipt; error?: string }> {
    try {
      const userId: number | null = this.userStateManager.getCurrentUserId()
      if (!userId) {
        return { error: 'Missing current user ID' }
      }

      const { txReceipt } =
        await this.contracts.EntityManagerClient!.manageEntity(
          userId,
          EntityType.NOTIFICATION,
          userId,
          Action.VIEW,
          ''
        )
      return { txReceipt }
    } catch (e) {
      const errorMessage = (e as Error).message
      logger.error(
        `Could not successfully submit view notification action to entity manager. Error: ${errorMessage}`
      )
      return { error: errorMessage }
    }
  }
}
