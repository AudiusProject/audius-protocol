require "resty.core"

local resty_random = require "resty.random"
local resty_rsa = require "resty.rsa"
local httpc = require "resty.http"

local config = require "config"
local utils = require "utils"

math.randomseed(string.byte(resty_random.bytes(1)))

local _M = {}

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

    local public_key = ngx.shared.rsa_public_key_store:get(discovery_provider)
    if not public_key then
        local res, err = httpc:request_uri(discovery_provider .. "/openresty_pubkey", { method = "GET" })
        if not res then
            ngx.log(ngx.ERR, "failed to get rsa key: ", err)
            return false
        end
        ngx.shared.rsa_public_key_store:set(discovery_provider, res, 60) -- cache key for 60 seconds
        public_key = res
    end

    ok = resty_rsa:new({
        public_key = public_key,
        key_type = resty_rsa.KEY_TYPE.PKCS1,
        algorithm = "sha1",
    }):verify(nonce, utils.from_hex(signature))

    if ok then
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
    return "redirect_from=" .. config.public_url .. "&redirect_nonce=" .. nonce .. "&redirect_sig=" .. utils.to_hex(sig)
end

return _M
