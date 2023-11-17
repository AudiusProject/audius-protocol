# FixedDecimal

A data structure to represent fixed precision decimals.

## Description

`FixedDecimal` is a data structure used to represent fixed precision decimals.

It's particularly useful for representing currency, especially cryptocurrency, as the underlying `bigint` can handle large amounts and extremely fractional amounts while keeping exact precision, and the configured decimal places count allows the class to conveniently operate on the underlying value and represent it in a user-friendly manner.

Unlike `BigDecimal` solutions elsewhere, `FixedDecimal` is not intended to be persisted and arithmetically operated on, but rather used ephemerally for normalizing and formatting. Almost all of its methods are chainable to make it convenient to initialize a `FixedDecimal`, operate on it, and immediately get back a string or `bigint` representation.

In fact, **you probably won't need to initialize a `FixedDecimal` directly.** Instead, use helper currency constructors that will ensure the input will be coerced to the proper number of decimals.

## Install

```bash
npm install @audius/fixed-decimal
```

## Usage

```ts
new FixedDecimal('12.345').toString() // '12.345'
new FixedDecimal(12.345).toString() // '12.345'
new FixedDecimal(BigInt(12345), 3).toString() // '12.345'

new FixedDecimal('12.345', 6).toString() // '12.345000'
new FixedDecimal(12.345, 6).toString() // '12.345000'
new FixedDecimal(BigInt(12345), 6).toString() // '0.012345'

new FixedDecimal(12345.6789).toLocaleString('en-US', {
  maximumFractionDigits: 2
}) // 12,345.67
new FixedDecimal(12345.6789).toLocaleString('en-US', {
  maximumFractionDigits: 2,
  roundingMode: 'halfExpand'
}) // 12,345.68
```

## Creating Currencies

If, for example, you want to use the 18 decimal ETH in your code, you could create a helper like:

```js
const ETH = (value) => new FixedDecimal(value, 18)
// Calling .value will get the wei amount
console.log(ETH('1.42')).value // 1420000000000000000n

// Can also go from wei to UI string
console.log(
  ETH(12345678901234567890n).toLocaleString('en-US', {
    maximumFractionDigits: 2
  })
) // 12.34
```

More examples and documentation can be found in the JSDoc and in the tests.
