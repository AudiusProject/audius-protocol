[@audius/fixed-decimal](../README.md) / [FixedDecimal](../modules/FixedDecimal.md) / FixedDecimal

# Class: FixedDecimal

[FixedDecimal](../modules/FixedDecimal.md).FixedDecimal

A data structure for fixed precision decimals.

**`Summary`**

`FixedDecimal` uses a `BigInt` and the number of decimal digits to represent
a fixed precision decimal number. It's useful for representing currency,
especially cryptocurrency, as the underlying `BigInt` can handle the large
amounts while keeping exact precision.

Unlike `BigDecimal` or `BigNumber` solutions elsewhere, `FixedDecimal`
is not intended to be persisted and arithmetically operated on, but
rather used ephemerally for normalizing and formatting. Almost all of
its methods are chainable to make it convenient to initialize a
`FixedDecimal`, operate on it, and immediately get back a string
or `bigint` representation. If you find yourself wanting to do
arithmetic with two `FixedDecimal`s, consider using `BigInt`s instead and
using `FixedDecimal` as the last step to format into a decimal.

**`Example`**

```ts
// Math on values. Make sure the decimalPlaces are the same!
const a = new FixedDecimal(1, 5)
const b = new FixedDecimal(2, 5)
a.value + b.value // 300000n
```

**`Example`**

```ts
// Automatically formats to fixed precision decimal strings
new FixedDecimal(1, 3).toString() // '1.000'
```

**`Example`**

```ts
// Represent fractional dollars and round to cents
new FixedDecimal(1.32542).toFixed(2) // '1.33'
```

## Table of contents

### Constructors

- [constructor](FixedDecimal.FixedDecimal.md#constructor)

### Properties

- [decimalPlaces](FixedDecimal.FixedDecimal.md#decimalplaces)
- [value](FixedDecimal.FixedDecimal.md#value)

### Methods

- [\_ceil](FixedDecimal.FixedDecimal.md#_ceil)
- [\_floor](FixedDecimal.FixedDecimal.md#_floor)
- [\_round](FixedDecimal.FixedDecimal.md#_round)
- [\_trunc](FixedDecimal.FixedDecimal.md#_trunc)
- [ceil](FixedDecimal.FixedDecimal.md#ceil)
- [floor](FixedDecimal.FixedDecimal.md#floor)
- [round](FixedDecimal.FixedDecimal.md#round)
- [toFixed](FixedDecimal.FixedDecimal.md#tofixed)
- [toLocaleString](FixedDecimal.FixedDecimal.md#tolocalestring)
- [toPrecision](FixedDecimal.FixedDecimal.md#toprecision)
- [toShorthand](FixedDecimal.FixedDecimal.md#toshorthand)
- [toString](FixedDecimal.FixedDecimal.md#tostring)
- [trunc](FixedDecimal.FixedDecimal.md#trunc)

## Constructors

### constructor

• **new FixedDecimal**(`value`, `decimalPlaces?`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

Constructs a [FixedDecimal](FixedDecimal.FixedDecimal.md).

If `decimalPlaces` is not specified, the number of decimals is inferred.

If `value` is a [FixedDecimal](FixedDecimal.FixedDecimal.md), converts to the new amount of
decimals, changing precision. Precision data loss may occur.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` \| `number` \| `bigint` \| `BN` \| [`FixedDecimalCtorArgs`](../modules/FixedDecimal.md#fixeddecimalctorargs) | The value to be represented. |
| `decimalPlaces?` | `number` | The number of decimal places the value has. |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Defined in

[FixedDecimal.ts:176](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L176)

## Properties

### decimalPlaces

• **decimalPlaces**: `number`

The number of decimal places.

#### Defined in

[FixedDecimal.ts:163](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L163)

___

### value

• **value**: `bigint`

The raw value. For currencies like ETH, this is the "wei" value.

#### Defined in

[FixedDecimal.ts:159](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L159)

## Methods

### \_ceil

▸ **_ceil**(`digitsToRemove`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitsToRemove` | `number` |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Defined in

[FixedDecimal.ts:236](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L236)

___

### \_floor

▸ **_floor**(`digitsToRemove`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitsToRemove` | `number` |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Defined in

[FixedDecimal.ts:258](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L258)

___

### \_round

▸ **_round**(`digitsToRemove`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitsToRemove` | `number` |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Defined in

[FixedDecimal.ts:304](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L304)

___

### \_trunc

▸ **_trunc**(`digitsToRemove`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitsToRemove` | `number` |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

#### Defined in

[FixedDecimal.ts:283](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L283)

___

### ceil

▸ **ceil**(`decimalPlaces?`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

Math.ceil() but for [FixedDecimal](FixedDecimal.FixedDecimal.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decimalPlaces?` | `number` | The number of decimal places ceil to. |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

A new [FixedDecimal](FixedDecimal.FixedDecimal.md) with the result for chaining.

#### Defined in

[FixedDecimal.ts:231](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L231)

___

### floor

▸ **floor**(`decimalPlaces?`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

Math.floor() but for [FixedDecimal](FixedDecimal.FixedDecimal.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decimalPlaces?` | `number` | The number of decimal places to floor to. |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

A new [FixedDecimal](FixedDecimal.FixedDecimal.md) with the result for chaining.

#### Defined in

[FixedDecimal.ts:253](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L253)

___

### round

▸ **round**(`decimalPlaces?`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

Math.round() but for [FixedDecimal](FixedDecimal.FixedDecimal.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decimalPlaces?` | `number` | The number of decimal places to round to. |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

A new [FixedDecimal](FixedDecimal.FixedDecimal.md) with the result for chaining.

#### Defined in

[FixedDecimal.ts:299](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L299)

___

### toFixed

▸ **toFixed**(`decimalPlaces?`): `string`

Number.toFixed() but for [FixedDecimal](FixedDecimal.FixedDecimal.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decimalPlaces?` | `number` | The number of decimal places to show. |

#### Returns

`string`

The number rounded to the decimal places specifed as a string.

#### Defined in

[FixedDecimal.ts:344](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L344)

___

### toLocaleString

▸ **toLocaleString**(`locale?`, `options?`): `string`

Analogous to Number().toLocaleString(), with some important differences in
the options available and the defaults. Be sure to check the defaults.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `locale?` | `string` | The string specifying the locale (default is 'en-US'). |
| `options?` | [`FixedDecimalFormatOptions`](../modules/FixedDecimal.md#fixeddecimalformatoptions) | The options for formatting. The available options and defaults are different than NumberFormat. |

#### Returns

`string`

**`See`**

[Mozilla NumberFormat documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)

#### Defined in

[FixedDecimal.ts:382](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L382)

___

### toPrecision

▸ **toPrecision**(`significantDigits`): `string`

Number.toPrecision() but for [FixedDecimal](FixedDecimal.FixedDecimal.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `significantDigits` | `number` | The number of significant digits to keep. |

#### Returns

`string`

The number truncated to the significant digits specified as a string.

#### Defined in

[FixedDecimal.ts:325](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L325)

___

### toShorthand

▸ **toShorthand**(): `string`

Formats the decimal as an easy-to-read shorthand summary.
Used primarily for balances in tiles and headers.

- Always truncates, never rounds up. (eg. `1.9999 => "1.99"`)
- Don't show decimal places if they'd appear as 0. (eg. `1.00234 => "1"`)
- Shows two decimal places if they'd be non-zero. (eg. `1.234 => "1.23"`)
- Count by 1,000s if over 10k (eg. `25413 => "25k"`)

#### Returns

`string`

**`Example`**

```ts
new FixedDecimal(0, 5).toShorthand() // "0"
new FixedDecimal(8, 5).toShorthand() // "8"
new FixedDecimal(8.01, 5).toShorthand() // "8.01"
new FixedDecimal(8.1, 5).toShorthand() // "8.10"
new FixedDecimal(4210, 5).toShorthand() // "4210"
new FixedDecimal(9999.99, 5).toShorthand() // "9999.99"
new FixedDecimal(56001.43, 5).toShorthand() // "56K"
new FixedDecimal(443123.23, 5).toShorthand() // "443K"
```

#### Defined in

[FixedDecimal.ts:455](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L455)

___

### toString

▸ **toString**(): `string`

Represents the [FixedDecimal](FixedDecimal.FixedDecimal.md) as a fixed decimal string by inserting the
decimal point in the appropriate spot and padding any needed zeros.

Not to be used for UI purposes.

#### Returns

`string`

**`See`**

[toLocaleString](FixedDecimal.FixedDecimal.md#tolocalestring) for UI appropriate strings.

#### Defined in

[FixedDecimal.ts:365](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L365)

___

### trunc

▸ **trunc**(`decimalPlaces?`): [`FixedDecimal`](FixedDecimal.FixedDecimal.md)

Math.trunc() but for [FixedDecimal](FixedDecimal.FixedDecimal.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decimalPlaces?` | `number` | The number of decimal places to truncate to. |

#### Returns

[`FixedDecimal`](FixedDecimal.FixedDecimal.md)

A new [FixedDecimal](FixedDecimal.FixedDecimal.md) with the result for chaining.

#### Defined in

[FixedDecimal.ts:278](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L278)
