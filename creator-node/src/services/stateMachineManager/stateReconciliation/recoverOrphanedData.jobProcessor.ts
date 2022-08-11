import type {
  DecoratedJobParams,
  DecoratedJobReturnValue,
  JobsToEnqueue
} from '../types'
import type {
  RecoverOrphanedDataJobParams,
  RecoverOrphanedDataJobReturnValue
} from './types'

const {
  QUEUE_NAMES
} = require('../../prometheusMonitoring/prometheus.constants')

/**
 * Processes a job to find users who have data on this node but who do not have this node in their replica set.
 * This means their data is "orphaned,"" so the job also merges this data back into the primary of the user's replica set and then wipes it from this node.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 */
module.exports = async function ({
  logger
}: DecoratedJobParams<RecoverOrphanedDataJobParams>): Promise<
  DecoratedJobReturnValue<RecoverOrphanedDataJobReturnValue>
> {
  // TODO: Clear redis state

  // TODO: Query this node's db to find all users who have data on it and save them in a redis set
  const usersOnThisNode = {}

  /**
   * TODO: Query Discovery to find all users who have this node as their primary or secondary.
   *       This will do some kind of while loop that requests paginated responses from
   *       `/v1/full/users/content_node/all?creator_node_endpoint=<THIS_CONTENT_NODE>` and adds
   *       them to a redis set until reaching the end of the pagination
   */
  const usersWithThisNodeInReplica = {}

  // TODO: Perform a set difference between usersOnThisNode and usersWithThisNodeInReplica.
  //       https://redis.io/commands/sdiff/
  const usersWithOrphanedData: any[] = []

  /**
   *  TODO: Run modified "force wipe" (modified forceResync=true flag) on each user with orphaned data:
   *        1. Merge orphaned data from this node into the user's primary.
   *        2. Wipe the user's data from this node.
   *        3. *DON'T* resync from the primary to this node -- this is what non-modified forceResync would do.
   * */

  // Enqueue another job to search for any new data that gets orphaned after this job finishes
  const jobsToEnqueue: JobsToEnqueue = {
    [QUEUE_NAMES.RECOVER_ORPHANED_DATA]: [{}]
  }
  return {
    jobsToEnqueue,
    usersWithOrphanedData
  }
}
