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
/**
 * 
 * @export
 * @interface SaleJson
 */
export interface SaleJson {
    /**
     * Title of the content (track/album/playlist)
     * @type {string}
     * @memberof SaleJson
     */
    title?: string;
    /**
     * Full URL link to the content
     * @type {string}
     * @memberof SaleJson
     */
    link?: string;
    /**
     * Name of the buyer
     * @type {string}
     * @memberof SaleJson
     */
    purchasedBy?: string;
    /**
     * User ID of the buyer
     * @type {number}
     * @memberof SaleJson
     */
    buyerUserId?: number;
    /**
     * ISO format date string of when the sale occurred
     * @type {string}
     * @memberof SaleJson
     */
    date?: string;
    /**
     * Base sale price in USDC
     * @type {number}
     * @memberof SaleJson
     */
    salePrice?: number;
    /**
     * Network fee deducted from sale in USDC
     * @type {number}
     * @memberof SaleJson
     */
    networkFee?: number;
    /**
     * Extra amount paid by buyer in USDC
     * @type {number}
     * @memberof SaleJson
     */
    payExtra?: number;
    /**
     * Total amount received by seller in USDC
     * @type {number}
     * @memberof SaleJson
     */
    total?: number;
    /**
     * Country code where purchase was made
     * @type {string}
     * @memberof SaleJson
     */
    country?: string;
    /**
     * Encrypted email of buyer if available
     * @type {string}
     * @memberof SaleJson
     */
    encryptedEmail?: string;
    /**
     * Encrypted key for decrypting the buyer's email
     * @type {string}
     * @memberof SaleJson
     */
    encryptedKey?: string;
    /**
     * Whether this is an initial encryption from the backfill
     * @type {boolean}
     * @memberof SaleJson
     */
    isInitial?: boolean;
    /**
     * Base64 encoded public key of the buyer
     * @type {string}
     * @memberof SaleJson
     */
    pubkeyBase64?: string;
}

/**
 * Check if a given object implements the SaleJson interface.
 */
export function instanceOfSaleJson(value: object): value is SaleJson {
    let isInstance = true;

    return isInstance;
}

export function SaleJsonFromJSON(json: any): SaleJson {
    return SaleJsonFromJSONTyped(json, false);
}

export function SaleJsonFromJSONTyped(json: any, ignoreDiscriminator: boolean): SaleJson {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'title': !exists(json, 'title') ? undefined : json['title'],
        'link': !exists(json, 'link') ? undefined : json['link'],
        'purchasedBy': !exists(json, 'purchased_by') ? undefined : json['purchased_by'],
        'buyerUserId': !exists(json, 'buyer_user_id') ? undefined : json['buyer_user_id'],
        'date': !exists(json, 'date') ? undefined : json['date'],
        'salePrice': !exists(json, 'sale_price') ? undefined : json['sale_price'],
        'networkFee': !exists(json, 'network_fee') ? undefined : json['network_fee'],
        'payExtra': !exists(json, 'pay_extra') ? undefined : json['pay_extra'],
        'total': !exists(json, 'total') ? undefined : json['total'],
        'country': !exists(json, 'country') ? undefined : json['country'],
        'encryptedEmail': !exists(json, 'encrypted_email') ? undefined : json['encrypted_email'],
        'encryptedKey': !exists(json, 'encrypted_key') ? undefined : json['encrypted_key'],
        'isInitial': !exists(json, 'is_initial') ? undefined : json['is_initial'],
        'pubkeyBase64': !exists(json, 'pubkey_base64') ? undefined : json['pubkey_base64'],
    };
}

export function SaleJsonToJSON(value?: SaleJson | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'title': value.title,
        'link': value.link,
        'purchased_by': value.purchasedBy,
        'buyer_user_id': value.buyerUserId,
        'date': value.date,
        'sale_price': value.salePrice,
        'network_fee': value.networkFee,
        'pay_extra': value.payExtra,
        'total': value.total,
        'country': value.country,
        'encrypted_email': value.encryptedEmail,
        'encrypted_key': value.encryptedKey,
        'is_initial': value.isInitial,
        'pubkey_base64': value.pubkeyBase64,
    };
}

