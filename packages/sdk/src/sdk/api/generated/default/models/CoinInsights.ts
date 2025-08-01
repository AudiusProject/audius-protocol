/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
/**
 * API
 * Audius V1 API
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { CoinInsightsExtensions } from './CoinInsightsExtensions';
import {
    CoinInsightsExtensionsFromJSON,
    CoinInsightsExtensionsFromJSONTyped,
    CoinInsightsExtensionsToJSON,
} from './CoinInsightsExtensions';

/**
 * Additional token information from Birdeye's defi token overview API.
 * Includes price, volume, supply, market cap, and other on-chain and market data.
 * 
 * @export
 * @interface CoinInsights
 */
export interface CoinInsights {
    /**
     * The SPL token mint address
     * @type {string}
     * @memberof CoinInsights
     */
    address: string;
    /**
     * Number of decimals for the token
     * @type {number}
     * @memberof CoinInsights
     */
    decimals: number;
    /**
     * The token symbol
     * @type {string}
     * @memberof CoinInsights
     */
    symbol: string;
    /**
     * The token name
     * @type {string}
     * @memberof CoinInsights
     */
    name: string;
    /**
     * Market capitalization in USD
     * @type {number}
     * @memberof CoinInsights
     */
    marketCap: number;
    /**
     * Fully diluted valuation in USD
     * @type {number}
     * @memberof CoinInsights
     */
    fdv: number;
    /**
     * 
     * @type {CoinInsightsExtensions}
     * @memberof CoinInsights
     */
    extensions: CoinInsightsExtensions;
    /**
     * URL to the token's logo image
     * @type {string}
     * @memberof CoinInsights
     */
    logoURI: string;
    /**
     * Current liquidity in USD
     * @type {number}
     * @memberof CoinInsights
     */
    liquidity: number;
    /**
     * Unix timestamp of the last trade
     * @type {number}
     * @memberof CoinInsights
     */
    lastTradeUnixTime: number;
    /**
     * ISO8601 time of the last trade
     * @type {string}
     * @memberof CoinInsights
     */
    lastTradeHumanTime: string;
    /**
     * Current price in USD
     * @type {number}
     * @memberof CoinInsights
     */
    price: number;
    /**
     * Price 24 hours ago in USD
     * @type {number}
     * @memberof CoinInsights
     */
    history24hPrice: number;
    /**
     * 24h price change in percent
     * @type {number}
     * @memberof CoinInsights
     */
    priceChange24hPercent: number;
    /**
     * Unique wallets traded in last 24h
     * @type {number}
     * @memberof CoinInsights
     */
    uniqueWallet24h: number;
    /**
     * Unique wallets traded in previous 24h
     * @type {number}
     * @memberof CoinInsights
     */
    uniqueWalletHistory24h: number;
    /**
     * 24h change in unique wallets (percent)
     * @type {number}
     * @memberof CoinInsights
     */
    uniqueWallet24hChangePercent: number;
    /**
     * Total supply of the token
     * @type {number}
     * @memberof CoinInsights
     */
    totalSupply: number;
    /**
     * Circulating supply of the token
     * @type {number}
     * @memberof CoinInsights
     */
    circulatingSupply: number;
    /**
     * Number of holders
     * @type {number}
     * @memberof CoinInsights
     */
    holder: number;
    /**
     * Number of trades in last 24h
     * @type {number}
     * @memberof CoinInsights
     */
    trade24h: number;
    /**
     * Number of trades in previous 24h
     * @type {number}
     * @memberof CoinInsights
     */
    tradeHistory24h: number;
    /**
     * 24h change in trade count (percent)
     * @type {number}
     * @memberof CoinInsights
     */
    trade24hChangePercent: number;
    /**
     * Number of sell trades in last 24h
     * @type {number}
     * @memberof CoinInsights
     */
    sell24h: number;
    /**
     * Number of sell trades in previous 24h
     * @type {number}
     * @memberof CoinInsights
     */
    sellHistory24h: number;
    /**
     * 24h change in sell trades (percent)
     * @type {number}
     * @memberof CoinInsights
     */
    sell24hChangePercent: number;
    /**
     * Number of buy trades in last 24h
     * @type {number}
     * @memberof CoinInsights
     */
    buy24h: number;
    /**
     * Number of buy trades in previous 24h
     * @type {number}
     * @memberof CoinInsights
     */
    buyHistory24h: number;
    /**
     * 24h change in buy trades (percent)
     * @type {number}
     * @memberof CoinInsights
     */
    buy24hChangePercent: number;
    /**
     * 24h trading volume (token units)
     * @type {number}
     * @memberof CoinInsights
     */
    v24h: number;
    /**
     * 24h trading volume in USD
     * @type {number}
     * @memberof CoinInsights
     */
    v24hUSD: number;
    /**
     * Previous 24h trading volume (token units)
     * @type {number}
     * @memberof CoinInsights
     */
    vHistory24h: number;
    /**
     * Previous 24h trading volume in USD
     * @type {number}
     * @memberof CoinInsights
     */
    vHistory24hUSD?: number;
    /**
     * 24h change in volume (percent)
     * @type {number}
     * @memberof CoinInsights
     */
    v24hChangePercent?: number;
    /**
     * 24h buy volume (token units)
     * @type {number}
     * @memberof CoinInsights
     */
    vBuy24h?: number;
    /**
     * 24h buy volume in USD
     * @type {number}
     * @memberof CoinInsights
     */
    vBuy24hUSD?: number;
    /**
     * Previous 24h buy volume (token units)
     * @type {number}
     * @memberof CoinInsights
     */
    vBuyHistory24h?: number;
    /**
     * Previous 24h buy volume in USD
     * @type {number}
     * @memberof CoinInsights
     */
    vBuyHistory24hUSD?: number;
    /**
     * 24h change in buy volume (percent)
     * @type {number}
     * @memberof CoinInsights
     */
    vBuy24hChangePercent?: number;
    /**
     * 24h sell volume (token units)
     * @type {number}
     * @memberof CoinInsights
     */
    vSell24h?: number;
    /**
     * 24h sell volume in USD
     * @type {number}
     * @memberof CoinInsights
     */
    vSell24hUSD?: number;
    /**
     * Previous 24h sell volume (token units)
     * @type {number}
     * @memberof CoinInsights
     */
    vSellHistory24h?: number;
    /**
     * Previous 24h sell volume in USD
     * @type {number}
     * @memberof CoinInsights
     */
    vSellHistory24hUSD?: number;
    /**
     * 24h change in sell volume (percent)
     * @type {number}
     * @memberof CoinInsights
     */
    vSell24hChangePercent?: number;
    /**
     * Number of markets the token is traded on
     * @type {number}
     * @memberof CoinInsights
     */
    numberMarkets?: number;
    /**
     * The number of Audius users holding the coin
     * @type {number}
     * @memberof CoinInsights
     */
    members: number;
    /**
     * The percentage change in the number of members holding the coin over the last 24 hours
     * @type {number}
     * @memberof CoinInsights
     */
    membersChange24hPercent: number;
}

/**
 * Check if a given object implements the CoinInsights interface.
 */
export function instanceOfCoinInsights(value: object): value is CoinInsights {
    let isInstance = true;
    isInstance = isInstance && "address" in value && value["address"] !== undefined;
    isInstance = isInstance && "decimals" in value && value["decimals"] !== undefined;
    isInstance = isInstance && "symbol" in value && value["symbol"] !== undefined;
    isInstance = isInstance && "name" in value && value["name"] !== undefined;
    isInstance = isInstance && "marketCap" in value && value["marketCap"] !== undefined;
    isInstance = isInstance && "fdv" in value && value["fdv"] !== undefined;
    isInstance = isInstance && "extensions" in value && value["extensions"] !== undefined;
    isInstance = isInstance && "logoURI" in value && value["logoURI"] !== undefined;
    isInstance = isInstance && "liquidity" in value && value["liquidity"] !== undefined;
    isInstance = isInstance && "lastTradeUnixTime" in value && value["lastTradeUnixTime"] !== undefined;
    isInstance = isInstance && "lastTradeHumanTime" in value && value["lastTradeHumanTime"] !== undefined;
    isInstance = isInstance && "price" in value && value["price"] !== undefined;
    isInstance = isInstance && "history24hPrice" in value && value["history24hPrice"] !== undefined;
    isInstance = isInstance && "priceChange24hPercent" in value && value["priceChange24hPercent"] !== undefined;
    isInstance = isInstance && "uniqueWallet24h" in value && value["uniqueWallet24h"] !== undefined;
    isInstance = isInstance && "uniqueWalletHistory24h" in value && value["uniqueWalletHistory24h"] !== undefined;
    isInstance = isInstance && "uniqueWallet24hChangePercent" in value && value["uniqueWallet24hChangePercent"] !== undefined;
    isInstance = isInstance && "totalSupply" in value && value["totalSupply"] !== undefined;
    isInstance = isInstance && "circulatingSupply" in value && value["circulatingSupply"] !== undefined;
    isInstance = isInstance && "holder" in value && value["holder"] !== undefined;
    isInstance = isInstance && "trade24h" in value && value["trade24h"] !== undefined;
    isInstance = isInstance && "tradeHistory24h" in value && value["tradeHistory24h"] !== undefined;
    isInstance = isInstance && "trade24hChangePercent" in value && value["trade24hChangePercent"] !== undefined;
    isInstance = isInstance && "sell24h" in value && value["sell24h"] !== undefined;
    isInstance = isInstance && "sellHistory24h" in value && value["sellHistory24h"] !== undefined;
    isInstance = isInstance && "sell24hChangePercent" in value && value["sell24hChangePercent"] !== undefined;
    isInstance = isInstance && "buy24h" in value && value["buy24h"] !== undefined;
    isInstance = isInstance && "buyHistory24h" in value && value["buyHistory24h"] !== undefined;
    isInstance = isInstance && "buy24hChangePercent" in value && value["buy24hChangePercent"] !== undefined;
    isInstance = isInstance && "v24h" in value && value["v24h"] !== undefined;
    isInstance = isInstance && "v24hUSD" in value && value["v24hUSD"] !== undefined;
    isInstance = isInstance && "vHistory24h" in value && value["vHistory24h"] !== undefined;
    isInstance = isInstance && "members" in value && value["members"] !== undefined;
    isInstance = isInstance && "membersChange24hPercent" in value && value["membersChange24hPercent"] !== undefined;

    return isInstance;
}

export function CoinInsightsFromJSON(json: any): CoinInsights {
    return CoinInsightsFromJSONTyped(json, false);
}

export function CoinInsightsFromJSONTyped(json: any, ignoreDiscriminator: boolean): CoinInsights {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'address': json['address'],
        'decimals': json['decimals'],
        'symbol': json['symbol'],
        'name': json['name'],
        'marketCap': json['marketCap'],
        'fdv': json['fdv'],
        'extensions': CoinInsightsExtensionsFromJSON(json['extensions']),
        'logoURI': json['logoURI'],
        'liquidity': json['liquidity'],
        'lastTradeUnixTime': json['lastTradeUnixTime'],
        'lastTradeHumanTime': json['lastTradeHumanTime'],
        'price': json['price'],
        'history24hPrice': json['history24hPrice'],
        'priceChange24hPercent': json['priceChange24hPercent'],
        'uniqueWallet24h': json['uniqueWallet24h'],
        'uniqueWalletHistory24h': json['uniqueWalletHistory24h'],
        'uniqueWallet24hChangePercent': json['uniqueWallet24hChangePercent'],
        'totalSupply': json['totalSupply'],
        'circulatingSupply': json['circulatingSupply'],
        'holder': json['holder'],
        'trade24h': json['trade24h'],
        'tradeHistory24h': json['tradeHistory24h'],
        'trade24hChangePercent': json['trade24hChangePercent'],
        'sell24h': json['sell24h'],
        'sellHistory24h': json['sellHistory24h'],
        'sell24hChangePercent': json['sell24hChangePercent'],
        'buy24h': json['buy24h'],
        'buyHistory24h': json['buyHistory24h'],
        'buy24hChangePercent': json['buy24hChangePercent'],
        'v24h': json['v24h'],
        'v24hUSD': json['v24hUSD'],
        'vHistory24h': json['vHistory24h'],
        'vHistory24hUSD': !exists(json, 'vHistory24hUSD') ? undefined : json['vHistory24hUSD'],
        'v24hChangePercent': !exists(json, 'v24hChangePercent') ? undefined : json['v24hChangePercent'],
        'vBuy24h': !exists(json, 'vBuy24h') ? undefined : json['vBuy24h'],
        'vBuy24hUSD': !exists(json, 'vBuy24hUSD') ? undefined : json['vBuy24hUSD'],
        'vBuyHistory24h': !exists(json, 'vBuyHistory24h') ? undefined : json['vBuyHistory24h'],
        'vBuyHistory24hUSD': !exists(json, 'vBuyHistory24hUSD') ? undefined : json['vBuyHistory24hUSD'],
        'vBuy24hChangePercent': !exists(json, 'vBuy24hChangePercent') ? undefined : json['vBuy24hChangePercent'],
        'vSell24h': !exists(json, 'vSell24h') ? undefined : json['vSell24h'],
        'vSell24hUSD': !exists(json, 'vSell24hUSD') ? undefined : json['vSell24hUSD'],
        'vSellHistory24h': !exists(json, 'vSellHistory24h') ? undefined : json['vSellHistory24h'],
        'vSellHistory24hUSD': !exists(json, 'vSellHistory24hUSD') ? undefined : json['vSellHistory24hUSD'],
        'vSell24hChangePercent': !exists(json, 'vSell24hChangePercent') ? undefined : json['vSell24hChangePercent'],
        'numberMarkets': !exists(json, 'numberMarkets') ? undefined : json['numberMarkets'],
        'members': json['members'],
        'membersChange24hPercent': json['membersChange24hPercent'],
    };
}

export function CoinInsightsToJSON(value?: CoinInsights | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'address': value.address,
        'decimals': value.decimals,
        'symbol': value.symbol,
        'name': value.name,
        'marketCap': value.marketCap,
        'fdv': value.fdv,
        'extensions': CoinInsightsExtensionsToJSON(value.extensions),
        'logoURI': value.logoURI,
        'liquidity': value.liquidity,
        'lastTradeUnixTime': value.lastTradeUnixTime,
        'lastTradeHumanTime': value.lastTradeHumanTime,
        'price': value.price,
        'history24hPrice': value.history24hPrice,
        'priceChange24hPercent': value.priceChange24hPercent,
        'uniqueWallet24h': value.uniqueWallet24h,
        'uniqueWalletHistory24h': value.uniqueWalletHistory24h,
        'uniqueWallet24hChangePercent': value.uniqueWallet24hChangePercent,
        'totalSupply': value.totalSupply,
        'circulatingSupply': value.circulatingSupply,
        'holder': value.holder,
        'trade24h': value.trade24h,
        'tradeHistory24h': value.tradeHistory24h,
        'trade24hChangePercent': value.trade24hChangePercent,
        'sell24h': value.sell24h,
        'sellHistory24h': value.sellHistory24h,
        'sell24hChangePercent': value.sell24hChangePercent,
        'buy24h': value.buy24h,
        'buyHistory24h': value.buyHistory24h,
        'buy24hChangePercent': value.buy24hChangePercent,
        'v24h': value.v24h,
        'v24hUSD': value.v24hUSD,
        'vHistory24h': value.vHistory24h,
        'vHistory24hUSD': value.vHistory24hUSD,
        'v24hChangePercent': value.v24hChangePercent,
        'vBuy24h': value.vBuy24h,
        'vBuy24hUSD': value.vBuy24hUSD,
        'vBuyHistory24h': value.vBuyHistory24h,
        'vBuyHistory24hUSD': value.vBuyHistory24hUSD,
        'vBuy24hChangePercent': value.vBuy24hChangePercent,
        'vSell24h': value.vSell24h,
        'vSell24hUSD': value.vSell24hUSD,
        'vSellHistory24h': value.vSellHistory24h,
        'vSellHistory24hUSD': value.vSellHistory24hUSD,
        'vSell24hChangePercent': value.vSell24hChangePercent,
        'numberMarkets': value.numberMarkets,
        'members': value.members,
        'membersChange24hPercent': value.membersChange24hPercent,
    };
}

