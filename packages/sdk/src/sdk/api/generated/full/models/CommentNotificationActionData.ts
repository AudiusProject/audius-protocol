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
 * @interface CommentNotificationActionData
 */
export interface CommentNotificationActionData {
    /**
     * 
     * @type {string}
     * @memberof CommentNotificationActionData
     */
    type: CommentNotificationActionDataTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof CommentNotificationActionData
     */
    entityId: string;
    /**
     * 
     * @type {string}
     * @memberof CommentNotificationActionData
     */
    commentUserId: string;
    /**
     * 
     * @type {string}
     * @memberof CommentNotificationActionData
     */
    commentId?: string;
}


/**
 * @export
 */
export const CommentNotificationActionDataTypeEnum = {
    Track: 'Track',
    Playlist: 'Playlist',
    Album: 'Album'
} as const;
export type CommentNotificationActionDataTypeEnum = typeof CommentNotificationActionDataTypeEnum[keyof typeof CommentNotificationActionDataTypeEnum];


/**
 * Check if a given object implements the CommentNotificationActionData interface.
 */
export function instanceOfCommentNotificationActionData(value: object): value is CommentNotificationActionData {
    let isInstance = true;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "entityId" in value && value["entityId"] !== undefined;
    isInstance = isInstance && "commentUserId" in value && value["commentUserId"] !== undefined;

    return isInstance;
}

export function CommentNotificationActionDataFromJSON(json: any): CommentNotificationActionData {
    return CommentNotificationActionDataFromJSONTyped(json, false);
}

export function CommentNotificationActionDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): CommentNotificationActionData {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'type': json['type'],
        'entityId': json['entity_id'],
        'commentUserId': json['comment_user_id'],
        'commentId': !exists(json, 'comment_id') ? undefined : json['comment_id'],
    };
}

export function CommentNotificationActionDataToJSON(value?: CommentNotificationActionData | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'type': value.type,
        'entity_id': value.entityId,
        'comment_user_id': value.commentUserId,
        'comment_id': value.commentId,
    };
}

