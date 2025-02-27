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
 * @interface CommentNotificationSetting
 */
export interface CommentNotificationSetting {
    /**
     * 
     * @type {boolean}
     * @memberof CommentNotificationSetting
     */
    isMuted: boolean;
}

/**
 * Check if a given object implements the CommentNotificationSetting interface.
 */
export function instanceOfCommentNotificationSetting(value: object): value is CommentNotificationSetting {
    let isInstance = true;
    isInstance = isInstance && "isMuted" in value && value["isMuted"] !== undefined;

    return isInstance;
}

export function CommentNotificationSettingFromJSON(json: any): CommentNotificationSetting {
    return CommentNotificationSettingFromJSONTyped(json, false);
}

export function CommentNotificationSettingFromJSONTyped(json: any, ignoreDiscriminator: boolean): CommentNotificationSetting {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'isMuted': json['is_muted'],
    };
}

export function CommentNotificationSettingToJSON(value?: CommentNotificationSetting | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'is_muted': value.isMuted,
    };
}

