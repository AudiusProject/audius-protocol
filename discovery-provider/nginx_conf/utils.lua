local _M = {}

-- generate a random 10 char string
function _M.generate_nonce ()
    local res = ""
    for i = 1, 10 do
        res = res .. string.char(math.random(97, 122))
    end
    return res
end

-- split string on comma
function _M.split_on_comma (str)
    local result = {}
    for match in string.gmatch(str, "[^,]+") do result[#result + 1] = match end
    return result
end

-- convert array (https://www.lua.org/pil/11.1.html) to set (https://www.lua.org/pil/11.5.html)
function _M.toset (arr)
    local set = {}
    for _, l in ipairs(arr) do set[l] = true end
    return set
end

function _M.starts_with(str, start)
    return str:sub(1, #start) == start
end

-- Sort keys in table t
function _M.sort_keys(t)
    local sorted_table = {}
    for k, v in pairs(t) do sorted_table[#sorted_table+1] = {k, v} end
    table.sort(sorted_table, function(a, b) return a[1] < b[1] end)
    return sorted_table
end

-- encode and sort table t in json
function _M.encode_sorted(t)
    local sorted_table = _M.sort_keys(t)
    local result = {}
    for _, kv in ipairs(sorted_table) do
        result[kv[1]] = kv[2]
    end
    return cjson.encode(result)
end

return _M
