[@audius/fixed-decimal](../README.md) / Currency Constructors

# Module: Currency Constructors

## Table of contents

### Functions

- [AUDIO](Currency_Constructors.md#audio)
- [SOL](Currency_Constructors.md#sol)
- [USDC](Currency_Constructors.md#usdc)
- [wAUDIO](Currency_Constructors.md#waudio)

### Type Aliases

- [AudioTokens](Currency_Constructors.md#audiotokens)
- [SolTokens](Currency_Constructors.md#soltokens)
- [UsdcTokens](Currency_Constructors.md#usdctokens)
- [wAudioTokens](Currency_Constructors.md#waudiotokens)

## Functions

### AUDIO

▸ **AUDIO**(`value`): [`AudioTokens`](Currency_Constructors.md#audiotokens)

Constructs an amount of [AudioTokens](Currency_Constructors.md#audiotokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `bigint` \| `BN` \| [`FixedDecimalCtorArgs`](FixedDecimal.md#fixeddecimalctorargs) |

#### Returns

[`AudioTokens`](Currency_Constructors.md#audiotokens)

#### Defined in

[currencies.ts:15](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L15)

___

### SOL

▸ **SOL**(`value`): [`SolTokens`](Currency_Constructors.md#soltokens)

Constructs an amount of [SolTokens](Currency_Constructors.md#soltokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `bigint` \| `BN` \| [`FixedDecimalCtorArgs`](FixedDecimal.md#fixeddecimalctorargs) |

#### Returns

[`SolTokens`](Currency_Constructors.md#soltokens)

#### Defined in

[currencies.ts:15](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L15)

___

### USDC

▸ **USDC**(`value`): [`UsdcTokens`](Currency_Constructors.md#usdctokens)

Constructs an amount of [UsdcTokens](Currency_Constructors.md#usdctokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `bigint` \| `BN` \| [`FixedDecimalCtorArgs`](FixedDecimal.md#fixeddecimalctorargs) |

#### Returns

[`UsdcTokens`](Currency_Constructors.md#usdctokens)

#### Defined in

[currencies.ts:15](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L15)

___

### wAUDIO

▸ **wAUDIO**(`value`): [`wAudioTokens`](Currency_Constructors.md#waudiotokens)

Constructs an amount of [wAudioTokens](Currency_Constructors.md#waudiotokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `bigint` \| `BN` \| [`FixedDecimalCtorArgs`](FixedDecimal.md#fixeddecimalctorargs) |

#### Returns

[`wAudioTokens`](Currency_Constructors.md#waudiotokens)

#### Defined in

[currencies.ts:15](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L15)

## Type Aliases

### AudioTokens

Ƭ **AudioTokens**: [`FixedDecimal`](../classes/FixedDecimal.FixedDecimal.md) & \{ `_brand`: ``"AUDIO"``  }

A [FixedDecimal](../classes/FixedDecimal.FixedDecimal.md) representing an amount of Ethereum ERC-20
AUDIO tokens, which have 18 decimal places.

Used on the protocol dashboard and in the governance and staking systems.
Also used for balance totals after adding linked wallets on the Rewards page.

#### Defined in

[currencies.ts:25](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L25)

___

### SolTokens

Ƭ **SolTokens**: [`FixedDecimal`](../classes/FixedDecimal.FixedDecimal.md) & \{ `_brand`: ``"SOL"``  }

A [FixedDecimal](../classes/FixedDecimal.FixedDecimal.md) representing an amount of Solana native SOL
tokens, which have 9 decimal places.

Used as an intermediary token for purchasing wAUDIO and for paying for fees
of Solana transactions on the platform.

#### Defined in

[currencies.ts:52](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L52)

___

### UsdcTokens

Ƭ **UsdcTokens**: [`FixedDecimal`](../classes/FixedDecimal.FixedDecimal.md) & \{ `_brand`: ``"USDC"``  }

A [FixedDecimal](../classes/FixedDecimal.FixedDecimal.md) representing an amount of Solana SPL USDC
tokens, which have 6 decimal places.

Used for purchasing content in-app, and getting "USD" prices via Jupiter
for the wAUDIO token and SOL.

#### Defined in

[currencies.ts:66](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L66)

___

### wAudioTokens

Ƭ **wAudioTokens**: [`FixedDecimal`](../classes/FixedDecimal.FixedDecimal.md) & \{ `_brand`: ``"wAUDIO"``  }

A [FixedDecimal](../classes/FixedDecimal.FixedDecimal.md) representing an amount of Solana SPL AUDIO
tokens, which have 8 decimal places.

Used for in-app experiences, like tipping and rewards.

#### Defined in

[currencies.ts:38](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/currencies.ts#L38)
