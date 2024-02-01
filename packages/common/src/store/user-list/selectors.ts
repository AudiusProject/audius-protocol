import { createSelector } from '@reduxjs/toolkit'

import {
  getOptimisticSupporters,
  getOptimisticSupporting,
  getSupportersOverrides,
  getSupportingOverrides
} from '~/store/tipping/selectors'
import { getId as getSupportingId } from '~/store/user-list/supporting/selectors'
import { getId as getSupportersId } from '~/store/user-list/top-supporters/selectors'
import { stringWeiToBN } from '~/utils/wallet'

import { ID } from '../../models'

export const makeGetOptimisticUserIdsIfNeeded = ({
  userIds,
  tag
}: {
  userIds: ID[]
  tag: string
}) =>
  createSelector(
    getSupportingId,
    getSupportingOverrides,
    getOptimisticSupporting,
    getSupportersId,
    getSupportersOverrides,
    getOptimisticSupporters,
    (
      supportingId,
      supportingOverridesMap,
      optimisticSupporting,
      supportersId,
      supportersOverridesMap,
      optimisticSupporters
    ) => {
      const userIdSet = new Set(userIds)

      if (tag === 'SUPPORTING') {
        /**
         * Get supporting overrides for the user whose modal info is displayed.
         * If none, then return userIds as-is.
         */
        const userId = supportingId
        if (!userId) {
          return userIds
        }

        const supportingOverridesMapForUser =
          supportingOverridesMap[userId] || {}
        const supportingOverridesKeysForUser = Object.keys(
          supportingOverridesMapForUser
        ).map((k) => parseInt(k))
        if (supportingOverridesKeysForUser.length === 0) {
          return userIds
        }

        /**
         * Include optimistic user ids that are not in userIds by getting
         * the optimistic supporting data, sorting by amount descending,
         * and checking the sorted ids in both the given userIds and the
         * optimistic user ids to include. This also preserves the sort
         * order and thus eventually displays the users correctly in the
         * supporting list modal.
         */
        const optimisticUserIdSetToInclude = new Set(
          supportingOverridesKeysForUser.filter((id) => !userIdSet.has(id))
        )
        const optimisticSupportingForUser = optimisticSupporting[userId]
        const optimisticSupportingForUserKeys = Object.keys(
          optimisticSupportingForUser
        ).map((k) => parseInt(k))

        const sortedIdsDesc = optimisticSupportingForUserKeys.sort((k1, k2) => {
          const amount1BN = stringWeiToBN(
            optimisticSupportingForUser[k1].amount
          )
          const amount2BN = stringWeiToBN(
            optimisticSupportingForUser[k2].amount
          )
          return amount1BN.gte(amount2BN) ? -1 : 1
        })

        const resultIds: ID[] = []
        sortedIdsDesc.forEach((id) => {
          if (userIdSet.has(id) || optimisticUserIdSetToInclude.has(id)) {
            resultIds.push(id)
          }
        })
        return resultIds
      } else if (tag === 'TOP SUPPORTERS') {
        /**
         * Get supporters overrides for the user whose modal info is displayed.
         * If none, then return userIds as-is.
         */
        const userId = supportersId
        if (!userId) {
          return userIds
        }

        const supportersOverridesMapForUser =
          supportersOverridesMap[userId] || {}
        const supportersOverridesKeysForUser = Object.keys(
          supportersOverridesMapForUser
        ).map((k) => parseInt(k))
        if (supportersOverridesKeysForUser.length === 0) {
          return userIds
        }

        /**
         * Include optimistic user ids that are not in userIds by getting
         * the optimistic supporters data, sorting by amount descending,
         * and checking the sorted ids in both the given userIds and the
         * optimistic user ids to include. This also preserves the sort
         * order and thus eventually displays the users correctly in the
         * top supporters list modal.
         */
        const optimisticUserIdSetToInclude = new Set(
          supportersOverridesKeysForUser.filter((id) => !userIdSet.has(id))
        ) as Set<number>
        const optimisticSupportersForUser = optimisticSupporters[userId]
        const optimisticSupportersForUserKeys = Object.keys(
          optimisticSupportersForUser
        ).map((k) => parseInt(k))

        const sortedIdsDesc = optimisticSupportersForUserKeys.sort((k1, k2) => {
          const amount1BN = stringWeiToBN(
            optimisticSupportersForUser[k1].amount
          )
          const amount2BN = stringWeiToBN(
            optimisticSupportersForUser[k2].amount
          )
          return amount1BN.gte(amount2BN) ? -1 : 1
        })

        const resultIds: ID[] = []
        sortedIdsDesc.forEach((id) => {
          if (userIdSet.has(id) || optimisticUserIdSetToInclude.has(id)) {
            resultIds.push(id)
          }
        })
        return resultIds
      }

      return userIds
    }
  )
