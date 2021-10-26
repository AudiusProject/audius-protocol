require "resty.core"

local resty_random = require "resty.random"
local resty_rsa = require "resty.rsa"
local cjson = require "cjson"
local resty_http = require "resty.http"

local config = require "config"
local utils = require "utils"

-- Set seed for lua's random number generator by generating a random byte with openssl
math.randomseed(string.byte(resty_random.bytes(1)))

local _M = {}

function get_cached_public_key (discovery_provider)
    local public_key = ngx.shared.rsa_public_key_store:get(discovery_provider)
    if not public_key then
        local httpc = resty_http.new()
        local res, err = httpc:request_uri(discovery_provider .. "/openresty_pubkey", { method = "GET" })
        httpc:close()
        if not res then
            return nil, err
        end
        ngx.shared.rsa_public_key_store:set(discovery_provider, res.body, 60) -- cache key for 60 seconds
        public_key = res.body
    end
    return public_key, nil
end

function _M.health_check ()
    local httpc = resty_http.new()
    local res, err = httpc:request_uri("http://127.0.0.1:3000/health_check", { method = "GET" })
    httpc:close()
    if not res then
        ngx.log(ngx.ERR, "failed to get health check: ", err)
        return nil
    end

    local data = cjson.decode(res.body)
    data["openresty"] = {
        ["rsa_public_key"] = config.rsa_public_key,
        ["public_url"] = config.public_url,
    }

    return cjson.encode(data)
end

function _M.get_redirect_target ()
    return config.redirect_targets[math.random(1, #config.redirect_targets)]
end

function _M.verify_signature (discovery_provider, nonce, signature)
    -- reject if one of the parameter is not provided
    if discovery_provider == nil or nonce == nil or signature == nil then
        return false
    end

    -- reject if nonce was already used
    if ngx.shared.nonce_store:get(discovery_provider .. ";" .. nonce) then
        return false
    end

    -- reject if discovery provider is not in the accept_redirect_from set
    if not config.accept_redirect_from[discovery_provider] then
        return false
    end

    local public_key, err = get_cached_public_key(discovery_provider)
    if not public_key then
        ngx.log(ngx.ERR, "failed to get rsa key: ", err)
        return false
    end

    local decoded_signature = ngx.decode_base64(signature)
    if not decoded_signature then
        return false
    end

    ok = resty_rsa:new({
        public_key = public_key,
        key_type = resty_rsa.KEY_TYPE.PKCS1,
        algorithm = "sha1",
    }):verify(nonce, decoded_signature)

    if ok then
        -- set nonce as used for discovery provider for next 60 seconds
        ngx.shared.nonce_store:set(discovery_provider .. ";" .. nonce, true, 60)
    end

    return ok
end

function _M.get_redirect_args ()
    local nonce = utils.generate_nonce()
    local sig, err = config.private_key:sign(nonce)
    if not sig then
        ngx.log(ngx.ERR, "Failed to sign nonce for redirect: ", err)
        return
    end
    return config.public_url, nonce, ngx.encode_base64(sig)
end

return _M
