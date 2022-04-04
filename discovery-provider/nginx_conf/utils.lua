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

return _M
