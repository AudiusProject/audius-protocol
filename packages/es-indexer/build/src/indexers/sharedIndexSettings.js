"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noWhitespaceLowerKeyword = exports.lowerKeyword = exports.standardText = exports.standardSuggest = exports.sharedIndexSettings = void 0;
exports.sharedIndexSettings = {
    analysis: {
        char_filter: {
            whitespace_remove: {
                type: 'pattern_replace',
                pattern: ' ',
                replacement: '',
                flags: '',
            },
        },
        normalizer: {
            lower_asciifolding: {
                type: 'custom',
                filter: ['asciifolding', 'lowercase'],
            },
            lower_asciifolding_no_whitespace: {
                type: 'custom',
                char_filter: ['whitespace_remove'],
                filter: ['asciifolding', 'lowercase'],
            },
        },
        analyzer: {
            standard_asciifolding: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['asciifolding', 'lowercase'],
            },
        },
    },
    index: {
        number_of_shards: 1,
        number_of_replicas: 0,
        refresh_interval: '5s',
        // get_feed_es uses terms lookup to get reposts by followers
        // default limit is 65536, but there are users that follow >65k people.
        // so set to a million
        max_terms_count: 1000000,
    },
};
exports.standardSuggest = {
    type: 'search_as_you_type',
    analyzer: 'standard_asciifolding',
};
exports.standardText = {
    type: 'text',
    analyzer: 'standard_asciifolding',
};
exports.lowerKeyword = {
    type: 'keyword',
    normalizer: 'lower_asciifolding',
};
exports.noWhitespaceLowerKeyword = {
    type: 'keyword',
    normalizer: 'lower_asciifolding_no_whitespace',
};
