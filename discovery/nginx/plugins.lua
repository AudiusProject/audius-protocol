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
        if match ~= '' then
            table.insert(result, match)
        end
    end
    return result
end

function _M.get_health_check()
    local plugins = split(config.registered_plugins, ",")

    local responses = {}
    for _, plugin in ipairs(plugins) do
        local upstream_url = string.format("/plugins/%s/health_check", plugin)
        local resp = fetch_json(upstream_url)
        if resp then
            responses[plugin] = resp
        end
    end

    local merged_json, err = cjson.encode(responses)
    if err then
        ngx.log(ngx.ERR, "failed to encode JSON: ", err)
        ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
    end
    return merged_json
end

return _M