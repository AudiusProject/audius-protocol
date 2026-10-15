# Audius Identity Service

The identity service maintains all the identity aspects of the Audius ecosystem such as storing encrypted auth ciphertexts, doing Twitter oauth and relay transactions on behalf of users

Read [the wiki](https://github.com/AudiusProject/apps/wiki/Identity-Service:-Overview) for more info.

## Coinflow session authentication

Current web/mobile clients obtain sessions directly from Coinflow using a Solana
wallet signature: fetch `GET /api/auth`, sign its message locally, then call
`GET /api/auth/session-key` with the base58 signature, wallet, blockchain, and
merchant ID. This flow does not use `coinflowApiKey` or the server's IP allowlist.
The private wallet key stays on the client. Sessions remain in memory, scoped by
account, signer, wallet, merchant, and environment, with a 25-minute refresh and
conservative 30-minute lifetime.

Older clients still obtain their session key from
`POST /coinflow/session-key`. The endpoint requires identity-service auth headers
and a fresh Ed25519 ownership proof from the Solana root wallet. The root wallet
is different from the public `spl_wallet` user bank address. No database migration
is required.

Keep these server-side variables configured while older clients use this endpoint:

- `coinflowApiKey`: the secret Coinflow merchant API key. Use the key for the
  merchant configured in the clients (`audius` in development, `tikilabs` in
  production). Do not put this key in web/mobile environment files.
- `coinflowEnvironment`: `sandbox` (default) or `prod`, matching the clients.

Older installations still depend on the API key's IP allowlist until they receive
the client update. Do not remove this endpoint, revoke the key, or remove its
allowlist entries as part of the wallet-signature rollout. No backend deployment,
Coinflow merchant setting change, or SDK upgrade is needed for the new flow.

The older client sends `{ wallet, environment, timestamp, signature }`, with a Unix
millisecond timestamp and base64 Ed25519 signature over the UTF-8 string
`Audius Coinflow session:<lowercase identity wallet>:<Solana root wallet>:<environment>:<timestamp>`.
The proof is valid for five minutes and is bound to the authenticated identity.
The endpoint returns `{ key, expiresAt }` with `Cache-Control: no-store`.

Session keys are kept in memory, scoped by identity, wallet, and environment,
and refreshed after 25 minutes. The components stop using an unrefreshed key
one minute before the conservative 30-minute expiry. Upstream errors are sanitized
so merchant credentials are not logged or returned.

Before production rollout, verify purchase and withdrawal on web, iOS, and
Android in sandbox, including guest checkout, session refresh, failed refresh
and retry, logout, and account switching. Verify that the embedded Coinflow
requests use session authentication. Confirm completion with Coinflow only after
production rollout and verification.

References: [session-key API](https://docs.coinflow.cash/api-reference/api-reference/authentication/get-session-key),
[session lifetime](https://docs.coinflow.cash/guides/payouts/implementation-methods/bank-authentication-ui).
