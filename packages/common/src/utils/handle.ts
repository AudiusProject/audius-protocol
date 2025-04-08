/**
 * (?:^|\s) - Match either the start of the string or a whitespace character
 * @ - Match the @ symbol
 * [\w_.]+ - Match one or more word characters (letters, numbers, underscore) or dots/periods
 * (?!\S*@) - Negative lookahead to ensure there isn't another @ character ahead (prevents matching emails)
 * (?=\s|$) - Positive lookahead to ensure the handle is followed by whitespace or end of string
 */
export const handleRegex = /(?:^|\s)@[\w_.]+(?!\S*@)(?=\s|$)/g
