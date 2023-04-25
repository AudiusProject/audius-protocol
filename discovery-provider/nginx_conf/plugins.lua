require "resty.core"

local cjson = require "cjson"
local ngx = require "ngx"
local config = require "config"

local _M = {}

function fetch_json(url)
    local resp = ngx.location.capture(url)
    if resp.status ~= ngx.HTTP_OK then
        return nil
    end

    local data, err = cjson.decode(resp.body)
    if err then
        ngx.log(ngx.ERR, "failed to decode JSON: ", err)
        return nil
    end

    return data
end

function split(str, delimiter)
    local result = {}
    for match in (str .. delimiter):gmatch("(.-)" .. delimiter) do
        table.insert(result, match)
    end
    return result
end

function _M.get_health_check()
    local urls = split(config.registered_plugins, ",")

    local responses = {}
    for _, url in ipairs(urls) do
        local upstream_url = string.format("http://%s:6000", url)
        local resp = fetch_json(upstream_url)
        if resp then
            for k, v in pairs(data) do
                merged_data[k] = v
            end
        end
    end

    local merged_json, err = cjson.encode(merged_data)
    if err then
        ngx.log(ngx.ERR, "failed to encode JSON: ", err)
        ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
    end
    return merged_json

return _M