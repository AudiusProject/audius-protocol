/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
/**
 * API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
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
 * @interface Reaction
 */
export interface Reaction {
    /**
     * 
     * @type {string}
     * @memberof Reaction
     */
    reactionValue: string;
    /**
     * 
     * @type {string}
     * @memberof Reaction
     */
    reactionType: string;
    /**
     * 
     * @type {string}
     * @memberof Reaction
     */
    senderUserId: string;
    /**
     * 
     * @type {string}
     * @memberof Reaction
     */
    reactedTo: string;
}

/**
 * Check if a given object implements the Reaction interface.
 */
export function instanceOfReaction(value: object): value is Reaction {
    let isInstance = true;
    isInstance = isInstance && "reactionValue" in value && value["reactionValue"] !== undefined;
    isInstance = isInstance && "reactionType" in value && value["reactionType"] !== undefined;
    isInstance = isInstance && "senderUserId" in value && value["senderUserId"] !== undefined;
    isInstance = isInstance && "reactedTo" in value && value["reactedTo"] !== undefined;

    return isInstance;
}

export function ReactionFromJSON(json: any): Reaction {
    return ReactionFromJSONTyped(json, false);
}

export function ReactionFromJSONTyped(json: any, ignoreDiscriminator: boolean): Reaction {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'reactionValue': json['reaction_value'],
        'reactionType': json['reaction_type'],
        'senderUserId': json['sender_user_id'],
        'reactedTo': json['reacted_to'],
    };
}

export function ReactionToJSON(value?: Reaction | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'reaction_value': value.reactionValue,
        'reaction_type': value.reactionType,
        'sender_user_id': value.senderUserId,
        'reacted_to': value.reactedTo,
    };
}
