import { Name } from '@audius/common'

import { Level } from 'common/store/errors/level'
import { reportToSentry } from 'common/store/errors/reportToSentry'
import { track } from 'store/analytics/providers'
import { isMobile, isElectron } from 'utils/clientUtil'

/**
 * Reports Rewards claim outcome to Identity, Amplitude, Sentry
 * with a fire-and-forget approach
 */

export class ClientRewardsReporter {
  source: 'mobile' | 'electron' | 'web'
  libs: any

  constructor(libs: any) {
    this.source = isMobile() ? 'mobile' : isElectron() ? 'electron' : 'web'
    this.libs = libs
  }

  reportSuccess({
    userId,
    challengeId,
    amount,
    specifier
  }: {
    userId: string
    challengeId: string
    amount: number
    specifier: string
  }) {
    ;(async () => {
      try {
        await track(Name.REWARDS_CLAIM_SUCCESS, {
          userId,
          challengeId,
          amount,
          specifier,
          source: this.source
        })
        await this.libs.Rewards.sendAttestationResult({
          status: 'success',
          userId,
          challengeId,
          amount,
          source: this.source,
          specifier
        })
      } catch (e) {
        console.log(`Report success failure: ${e}`)
      }
    })()
  }

  reportRetry({
    userId,
    challengeId,
    amount,
    error,
    phase,
    specifier
  }: {
    userId: string
    challengeId: string
    amount: number
    error: string
    phase: string
    specifier: string
  }) {
    ;(async () => {
      try {
        await track(Name.REWARDS_CLAIM_RETRY, {
          userId,
          challengeId,
          amount,
          specifier,
          error,
          phase,
          source: this.source
        })
        await this.libs.Rewards.sendAttestationResult({
          status: 'retry',
          userId,
          challengeId,
          amount,
          error,
          phase,
          source: this.source,
          specifier
        })
      } catch (e) {
        console.log(`Report retry failure: ${e}`)
      }
    })()
  }

  reportFailure({
    userId,
    challengeId,
    amount,
    error,
    phase,
    specifier
  }: {
    userId: string
    challengeId: string
    amount: number
    error: string
    phase: string
    specifier: string
  }) {
    ;(async () => {
      try {
        await track(Name.REWARDS_CLAIM_FAILURE, {
          userId,
          challengeId,
          amount,
          specifier,
          error,
          phase,
          source: this.source
        })
        const sentryError = `RewardsClaimFailure:${error}`
        await reportToSentry({
          level: Level.Error,
          error: new Error(sentryError),
          name: sentryError,
          additionalInfo: {
            userId,
            challengeId,
            amount,
            error,
            phase,
            specifier
          }
        })
        await this.libs.Rewards.sendAttestationResult({
          status: 'failure',
          userId,
          challengeId,
          amount,
          error,
          phase,
          source: this.source,
          specifier
        })
      } catch (e) {
        console.log(`Report failure failure: ${e}`)
      }
    })()
  }

  reportAAORejection({
    userId,
    challengeId,
    amount,
    error,
    specifier,
    reason
  }: {
    userId: string
    challengeId: string
    amount: number
    error: string
    specifier: string
    reason: 'hcaptcha' | 'cognito' | 'rejection' | 'unknown'
  }) {
    ;(async () => {
      const map: Record<
        'hcaptcha' | 'cognito' | 'rejection' | 'unknown',
        Name
      > = {
        hcaptcha: Name.REWARDS_CLAIM_HCAPTCHA,
        cognito: Name.REWARDS_CLAIM_COGNITO,
        rejection: Name.REWARDS_CLAIM_REJECTION,
        unknown: Name.REWARDS_CLAIM_UNKNOWN
      }
      const event = map[reason]

      try {
        await track(event, {
          userId,
          challengeId,
          amount,
          specifier,
          error,
          source: this.source
        })

        await this.libs.Rewards.sendAttestationResult({
          status: 'rejection',
          userId,
          challengeId,
          amount,
          error,
          source: this.source,
          specifier,
          reason
        })
      } catch (e) {
        console.log(`Report AAO rejection failure: ${e}`)
      }
    })()
  }
}
