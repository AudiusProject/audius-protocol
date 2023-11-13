# Fixed Decimal

A data structure to represent fixed precision decimals.

## Install

```bash
npm install @audius/fixed-decimal
```

## Classes

<dl>
<dt><a href="#FixedDecimal">FixedDecimal</a></dt>
<dd><p><code>FixedDecimal</code> uses a <code>BigInt</code> and the number of decimal digits to represent
a fixed precision decimal number. It's useful for representing currency,
especially cryptocurrency, as the underlying BigInt can handle the large
amounts while keeping exact precision.</p>
<p>This class is not meant to be persisted and used in arithmetic. It's
intended to be convenience utilites for formatting large numbers
according to their decimal counts. If you find yourself wanting to do
arithmetic with two <code>FixedDecimal</code>s, consider using <code>BigInt</code> instead and
using <code>FixedDecimal</code> as the last step to format into a decimal.
As an escape hatch, you can access the underlying <code>BigInt</code> value.</p></dd>
</dl>

## Constants

<dl>
<dt><a href="#AUDIO">AUDIO</a></dt>
<dd><p>Constructs an amount of [AudioTokens](AudioTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p></dd>
<dt><a href="#wAUDIO">wAUDIO</a></dt>
<dd><p>Constructs an amount of [wAudioTokens](wAudioTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p></dd>
<dt><a href="#SOL">SOL</a></dt>
<dd><p>Constructs an amount of [SolTokens](SolTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p></dd>
<dt><a href="#USDC">USDC</a></dt>
<dd><p>Constructs an amount of [UsdcTokens](UsdcTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p></dd>
</dl>

<a name="FixedDecimal"></a>

## FixedDecimal
<p><code>FixedDecimal</code> uses a <code>BigInt</code> and the number of decimal digits to represent
a fixed precision decimal number. It's useful for representing currency,
especially cryptocurrency, as the underlying BigInt can handle the large
amounts while keeping exact precision.</p>
<p>This class is not meant to be persisted and used in arithmetic. It's
intended to be convenience utilites for formatting large numbers
according to their decimal counts. If you find yourself wanting to do
arithmetic with two <code>FixedDecimal</code>s, consider using <code>BigInt</code> instead and
using <code>FixedDecimal</code> as the last step to format into a decimal.
As an escape hatch, you can access the underlying <code>BigInt</code> value.</p>

**Kind**: global class  
**See**

- [AUDIO](#AUDIO) for the Ethereum ERC-20 AUDIO token
- [wAUDIO](#wAUDIO) for the Solana SPL "wrapped" AUDIO token
- [SOL](#SOL) for the Solana native SOL token
- [USDC](#USDC) for the Solana Circle USDC stablecoin token


* [FixedDecimal](#FixedDecimal)
    * [new FixedDecimal(value, decimalPlaces)](#new_FixedDecimal_new)
    * [.ceil(decimalPlaces)](#FixedDecimal+ceil) ⇒
    * [.floor(decimalPlaces)](#FixedDecimal+floor) ⇒
    * [.trunc(decimalPlaces)](#FixedDecimal+trunc) ⇒
    * [.round(decimalPlaces)](#FixedDecimal+round) ⇒
    * [.toPrecision(significantDigits)](#FixedDecimal+toPrecision) ⇒
    * [.toFixed(decimalPlaces)](#FixedDecimal+toFixed) ⇒
    * [.toString()](#FixedDecimal+toString)
    * [.toLocaleString(locale, options)](#FixedDecimal+toLocaleString)
    * [.toShorthand()](#FixedDecimal+toShorthand)

<a name="new_FixedDecimal_new"></a>

### new FixedDecimal(value, decimalPlaces)
<p>Constructs a [FixedDecimal](#FixedDecimal).</p>
<p>If <code>decimalPlaces</code> is not specified, the number of decimals is inferred.</p>
<p>If <code>value</code> is a [FixedDecimal](#FixedDecimal), converts to the new amount of
decimals, changing precision. Precision data loss may occur.</p>


| Param | Description |
| --- | --- |
| value | <p>The value to be represented.</p> |
| decimalPlaces | <p>The number of decimal places the value has.</p> |

**Example**  
```js
// Math on values. Make sure the decimalPlaces are the same!
const a = new FixedDecimal(1, 5)
const b = new FixedDecimal(2, 5)
a.value + b.value // 300000n
```
**Example**  
```js
// Automatically formats to fixed precision decimal strings
new FixedDecimal(1, 3).toString() // '1.000'
```
**Example**  
```js
// Represent fractional dollars and round to cents
new FixedDecimal(1.32542).toFixed(2) // '1.33'
```
<a name="FixedDecimal+ceil"></a>

### fixedDecimal.ceil(decimalPlaces) ⇒
<p>Math.ceil() but for [FixedDecimal](#FixedDecimal).</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**Returns**: <p>A new [FixedDecimal](#FixedDecimal) with the result for chaining.</p>  

| Param | Description |
| --- | --- |
| decimalPlaces | <p>The number of decimal places ceil to.</p> |

<a name="FixedDecimal+floor"></a>

### fixedDecimal.floor(decimalPlaces) ⇒
<p>Math.floor() but for [FixedDecimal](#FixedDecimal).</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**Returns**: <p>A new [FixedDecimal](#FixedDecimal) with the result for chaining.</p>  

| Param | Description |
| --- | --- |
| decimalPlaces | <p>The number of decimal places to floor to.</p> |

<a name="FixedDecimal+trunc"></a>

### fixedDecimal.trunc(decimalPlaces) ⇒
<p>Math.trunc() but for [FixedDecimal](#FixedDecimal).</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**Returns**: <p>A new [FixedDecimal](#FixedDecimal) with the result for chaining.</p>  

| Param | Description |
| --- | --- |
| decimalPlaces | <p>The number of decimal places to truncate to.</p> |

<a name="FixedDecimal+round"></a>

### fixedDecimal.round(decimalPlaces) ⇒
<p>Math.round() but for [FixedDecimal](#FixedDecimal).</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**Returns**: <p>A new [FixedDecimal](#FixedDecimal) with the result for chaining.</p>  

| Param | Description |
| --- | --- |
| decimalPlaces | <p>The number of decimal places to round to.</p> |

<a name="FixedDecimal+toPrecision"></a>

### fixedDecimal.toPrecision(significantDigits) ⇒
<p>Number.toPrecision() but for [FixedDecimal](#FixedDecimal).</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**Returns**: <p>The number truncated to the significant digits specified as a string.</p>  

| Param | Description |
| --- | --- |
| significantDigits | <p>The number of significant digits to keep.</p> |

<a name="FixedDecimal+toFixed"></a>

### fixedDecimal.toFixed(decimalPlaces) ⇒
<p>Number.toFixed() but for [FixedDecimal](#FixedDecimal).</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**Returns**: <p>The number rounded to the decimal places specifed as a string.</p>  

| Param | Description |
| --- | --- |
| decimalPlaces | <p>The number of decimal places to show.</p> |

<a name="FixedDecimal+toString"></a>

### fixedDecimal.toString()
<p>Represents the [FixedDecimal](#FixedDecimal) as a fixed decimal string by inserting the
decimal point in the appropriate spot and padding any needed zeros.</p>
<p>Not to be used for UI purposes.</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**See**: [toLocaleString](toLocaleString) for UI appropriate strings.  
<a name="FixedDecimal+toLocaleString"></a>

### fixedDecimal.toLocaleString(locale, options)
<p>Analogous to Number().toLocaleString(), with some important differences in
the options available and the defaults. Be sure to check the defaults.</p>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**See**

- [defaultFormatOptions](defaultFormatOptions)
- [Mozilla NumberFormat documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)


| Param | Description |
| --- | --- |
| locale | <p>The string specifying the locale (default is 'en-US').</p> |
| options | <p>The options for formatting. The available options and defaults are different than NumberFormat.</p> |

<a name="FixedDecimal+toShorthand"></a>

### fixedDecimal.toShorthand()
<p>Formats the decimal as an easy-to-read shorthand summary.
Used primarily for balances in tiles and headers.</p>
<ul>
<li>Always truncates, never rounds up. (eg. <code>1.9999 =&gt; &quot;1.99&quot;</code>)</li>
<li>Don't show decimal places if they'd appear as 0. (eg. <code>1.00234 =&gt; &quot;1&quot;</code>)</li>
<li>Shows two decimal places if they'd be non-zero. (eg. <code>1.234 =&gt; &quot;1.23&quot;</code>)</li>
<li>Count by 1,000s if over 10k (eg. <code>25413 =&gt; &quot;25k&quot;</code>)</li>
</ul>

**Kind**: instance method of [<code>FixedDecimal</code>](#FixedDecimal)  
**Example**  
```js
new FixedDecimal(0, 5).toShorthand() // "0"
new FixedDecimal(8, 5).toShorthand() // "8"
new FixedDecimal(8.01, 5).toShorthand() // "8.01"
new FixedDecimal(8.1, 5).toShorthand() // "8.10"
new FixedDecimal(4210, 5).toShorthand() // "4210"
new FixedDecimal(9999.99, 5).toShorthand() // "9999.99"
new FixedDecimal(56001.43, 5).toShorthand() // "56K"
new FixedDecimal(443123.23, 5).toShorthand() // "443K"
```
<a name="AUDIO"></a>

## AUDIO
<p>Constructs an amount of [AudioTokens](AudioTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p>

**Kind**: global constant  
<a name="wAUDIO"></a>

## wAUDIO
<p>Constructs an amount of [wAudioTokens](wAudioTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p>

**Kind**: global constant  
<a name="SOL"></a>

## SOL
<p>Constructs an amount of [SolTokens](SolTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p>

**Kind**: global constant  
<a name="USDC"></a>

## USDC
<p>Constructs an amount of [UsdcTokens](UsdcTokens) from a fixed decimal string,
decimal number, or a bigint or BN in the smallest denomination.</p>

**Kind**: global constant  
