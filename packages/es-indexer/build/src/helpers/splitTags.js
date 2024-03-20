"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitTags = void 0;
function splitTags(tags) {
    if (!tags)
        return [];
    return tags
        .split(',')
        .map(function (t) { return t.trim(); })
        .filter(Boolean);
}
exports.splitTags = splitTags;
