import fetch from 'cross-fetch'

import { BaseAPI, JSONApiResponse, exists } from '../../api/generated/default'
import * as runtime from '../../api/generated/default/runtime'
import { parseParams } from '../../utils/parseParams'
import { AntiAbuseOracleSelectorService } from '../AntiAbuseOracleSelector'

import {
  AntiAbuseOracleConfig,
  AntiAbuseOracleService,
  AttestationRequest,
  AttestationResponse,
  GetAttestationSchema
} from './types'

export class AntiAbuseOracle extends BaseAPI implements AntiAbuseOracleService {
  private readonly antiAbuseOracleSelector: AntiAbuseOracleSelectorService

  constructor({ antiAbuseOracleSelector }: AntiAbuseOracleConfig) {
    super(
      new runtime.Configuration({
        fetchApi: fetch,
        middleware: [antiAbuseOracleSelector.createMiddleware()]
      })
    )
    this.antiAbuseOracleSelector = antiAbuseOracleSelector
  }

  public async getWalletAddress() {
    const selected = await this.antiAbuseOracleSelector.getSelectedService()
    return selected.wallet
  }

  public async getChallengeAttestation(
    params: AttestationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    const response = await this.getChallengeAttestationRaw(
      params,
      initOverrides
    )
    return await response.value()
  }

  public async getChallengeAttestationRaw(
    params: AttestationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    const { handle, challengeId, specifier, amount } = await parseParams(
      'getChallengeAttestation',
      GetAttestationSchema
    )(params)
    const response = await this.request(
      {
        path: `/attestation/${handle}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          challengeId,
          challengeSpecifier: specifier,
          amount
        }
      },
      initOverrides
    )
    return new JSONApiResponse<AttestationResponse>(response, (json) => ({
      result: exists(json, 'result') ? json.result : false,
      errorCode: exists(json, 'errorCode') ? json.errorCode : undefined
    }))
  }
}
