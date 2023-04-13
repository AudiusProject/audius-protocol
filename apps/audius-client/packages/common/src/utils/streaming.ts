import { PremiumContentSignature } from 'models';
import { AudiusBackend, QueryParams } from 'services/index';
import { Nullable } from './typeUtils';

export async function generateUserSignature(
  audiusBackendInstance: AudiusBackend
) {
  const data = `Premium content user signature at ${Date.now()}`
  const signature = await audiusBackendInstance.getSignature(data)
  return { data, signature }
}

export async function getQueryParams({ audiusBackendInstance, premiumContentSignature }: { audiusBackendInstance: AudiusBackend, premiumContentSignature: Nullable<PremiumContentSignature> }) {
  const { data, signature } = await generateUserSignature(audiusBackendInstance)
  const queryParams: QueryParams = {}
  queryParams.user_data = data
  queryParams.user_signature = signature
  if (premiumContentSignature) {
    queryParams.premium_content_signature = JSON.stringify(
      premiumContentSignature
    )
  }
  return queryParams
}
