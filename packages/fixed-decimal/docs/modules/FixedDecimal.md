[@audius/fixed-decimal](../README.md) / FixedDecimal

# Module: FixedDecimal

## Table of contents

### Classes

- [FixedDecimal](../classes/FixedDecimal.FixedDecimal.md)

### Type Aliases

- [FixedDecimalCtorArgs](FixedDecimal.md#fixeddecimalctorargs)
- [FixedDecimalFormatOptions](FixedDecimal.md#fixeddecimalformatoptions)

## Type Aliases

### FixedDecimalCtorArgs

Ƭ **FixedDecimalCtorArgs**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `decimalPlaces` | `number` |
| `value` | `bigint` |

#### Defined in

[FixedDecimal.ts:27](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L27)

___

### FixedDecimalFormatOptions

Ƭ **FixedDecimalFormatOptions**: `Object`

A custom options type for the custom toLocaleString() implementation of
[FixedDecimal](../classes/FixedDecimal.FixedDecimal.md) that only allows the supported subset of the
[Intl.NumberFormat options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat).

**`See`**

[MDN documentation for Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `maximumFractionDigits?` | `number` | The maximum number of fraction digits to use. **`Default Value`** `this.decimalPlaces` (include all decimal places) |
| `minimumFractionDigits?` | `number` | The minimum number of fraction digits to use. **`Default Value`** `0` |
| `roundingMode?` | ``"ceil"`` \| ``"floor"`` \| ``"trunc"`` \| ``"halfExpand"`` | How decimals should be rounded. Possible values are: `'ceil'` > Round toward +∞. Positive values round up. Negative values round "more positive". `'floor'` > Round toward -∞. Positive values round down. Negative values round "more negative". `'trunc'` (default) > Round toward 0. This _magnitude_ of the value is always reduced by rounding. Positive values round down. Negative values round "less negative". `'halfExpand'` > Ties away from 0. Values above the half-increment round away from zero, and below towards 0. Does what Math.round() does. Note: Does not support `'expand'`, `'halfCeil'`, `'halfFloor'`, `'halfTrunc'` or `'halfEven'` **`Default Value`** `'trunc'` |
| `trailingZeroDisplay?` | ``"auto"`` \| ``"stripIfInteger"`` | The strategy for displaying trailing zeros on whole numbers. Possible values are: `'auto'` (default) > Keep trailing zeros according to minimumFractionDigits and minimumSignificantDigits. `'stripIfInteger'` > Remove the fraction digits if they are all zero. This is the same as "auto" if any of the fraction digits is non-zero. **`Default Value`** `'auto'` |
| `useGrouping?` | `boolean` | Whether to use grouping separators, such as thousands separators or thousand/lakh/crore separators. Note: Does not support `'always'`, `'auto'`, or `'min2'` **`Default Value`** `true` |

#### Defined in

[FixedDecimal.ts:39](https://github.com/AudiusProject/audius-protocol/blob/643ae60c22/packages/fixed-decimal/src/FixedDecimal.ts#L39)
