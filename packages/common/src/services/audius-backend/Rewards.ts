import { Name, AnalyticsEvent } from '~/models/Analytics'
import { ErrorLevel, ReportToSentryArgs } from '~/models/ErrorReporting'

/**
 * Reports Rewards claim outcome to Identity, Amplitude, Sentry
 * with a fire-and-forget approach
 */

type ClientRewardsReporterParams = {
  libs: any
  source: 'mobile' | 'electron' | 'web'
  recordAnalytics: (event: AnalyticsEvent, callback?: () => void) => void
  reportError: ({
    level,
    additionalInfo,
    error,
    name
  }: ReportToSentryArgs) => void | Promise<void>
}

export class ClientRewardsReporter {
  libs: ClientRewardsReporterParams['libs']
  source: ClientRewardsReporterParams['source']
  recordAnalytics: ClientRewardsReporterParams['recordAnalytics']
  reportError: ClientRewardsReporterParams['reportError']

  constructor({
    libs,
    recordAnalytics,
    source,
    reportError
  }: ClientRewardsReporterParams) {
    this.source = source
    this.libs = libs
    this.recordAnalytics = recordAnalytics
    this.reportError = reportError
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
        await this.recordAnalytics({
          eventName: Name.REWARDS_CLAIM_SUCCESS,
          properties: {
            userId,
            challengeId,
            amount,
            specifier,
            source: this.source
          }
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
        console.error(`Report success failure: ${e}`)
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
        await this.recordAnalytics({
          eventName: Name.REWARDS_CLAIM_RETRY,
          properties: {
            userId,
            challengeId,
            amount,
            specifier,
            error,
            phase,
            source: this.source
          }
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
        console.error(`Report retry failure: ${e}`)
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
        await this.recordAnalytics({
          eventName: Name.REWARDS_CLAIM_FAILURE,
          properties: {
            userId,
            challengeId,
            amount,
            specifier,
            error,
            phase,
            source: this.source
          }
        })
        const sentryError = `RewardsClaimFailure:${error}`
        await this.reportError({
          level: ErrorLevel.Error,
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
        console.error(`Report failure failure: ${e}`)
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
    reason: 'hcaptcha' | 'rejection' | 'unknown'
  }) {
    ;(async () => {
      const map: Record<'hcaptcha' | 'rejection' | 'unknown', Name> = {
        hcaptcha: Name.REWARDS_CLAIM_HCAPTCHA,
        rejection: Name.REWARDS_CLAIM_REJECTION,
        unknown: Name.REWARDS_CLAIM_UNKNOWN
      }
      const event = map[reason]

      try {
        await this.recordAnalytics({
          eventName: event,
          properties: {
            userId,
            challengeId,
            amount,
            specifier,
            error,
            source: this.source
          }
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
        console.error(`Report AAO rejection failure: ${e}`)
      }
    })()
  }
}
