require "resty.core"

local resty_random = require("resty.random")
local resty_rsa = require("resty.rsa")
local httpc = require("resty.http")

math.randomseed(string.byte(resty_random.bytes(1)))

local _M = {}

local rate_limit = tonumber(os.getenv("audius_openresty_rate_limit") or "1000")

local public_url = os.getenv("audius_openresty_public_url") or ""

local redirect_to = {}
for discovery_provider in string.gmatch(os.getenv("audius_openresty_redirect_to") or "", "[^,]+") do
    table.insert(redirect_to, discovery_provider)
end

local accept_redirect_from = {}
for discovery_provider in string.gmatch(os.getenv("audius_openresty_accept_redirect_from") or "", "[^,]+") do
    accept_redirect_from[discovery_provider] = true
end

local rsa_public_key = os.getenv("audius_openresty_rsa_public_key") or ""
local rsa_private_key = os.getenv("audius_openresty_rsa_private_key") or ""
if (#rsa_public_key == 0 or #rsa_private_key == 0) then
    ngx.log(ngx.WARN, "audius_openresty_rsa_private_key or audius_openresty_rsa_public_key was not set generating new key")
    rsa_public_key, rsa_private_key, err = resty_rsa:generate_rsa_keys(2048)
    if not rsa_private_key then
        ngx.log(ngx.ERR, "Failed to generate rsa private key: ", err)
    end
end

local private_key, err = resty_rsa:new({
    private_key = rsa_private_key,
    key_type = resty_rsa.KEY_TYPE.PKCS1,
    algorithm = "sha1",
})

if not private_key then
    ngx.log(ngx.ERR, "Failed to load private key: ", err)
end

function generate_nonce ()
    local res = ""
    for i = 1, 10 do
        res = res .. string.char(math.random(97, 122))
    end
    return res
end

function from_hex(str)
    return (str:gsub('..', function (cc)
        return string.char(tonumber(cc, 16))
    end))
end

function to_hex(str)
    return (str:gsub('.', function (c)
        return string.format('%02X', string.byte(c))
    end))
end

function _M.get_public_key ()
    return rsa_public_key
end

function _M.get_rate_limit ()
    return rate_limit
end

function _M.get_no_redirect ()
    return #redirect_to == 0
end

function _M.get_redirect_to ()
    return redirect_to[math.random(1, #redirect_to)]
end

function _M.verify (discovery_provider, nonce, signature)
    -- reject if nonce was already used
    if ngx.shared.nonce_store:get(discovery_provider .. ";" .. nonce) then
        return false
    end

    if not accept_redirect_from[discovery_provider] then
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
    }):verify(nonce, from_hex(signature))

    if ok then
        ngx.shared.nonce_store:set(discovery_provider .. ";" .. nonce, true, 60)
    end

    return ok
end

function _M.get_redirect_args ()
    local nonce = generate_nonce()
    local sig, err = private_key:sign(nonce)
    if not sig then
        ngx.log(ngx.ERR, "Failed to sign nonce for redirect: ", err)
        return
    end
    return "redirect_from=" .. public_url .. "&redirect_nonce=" .. nonce .. "&redirect_sig=" .. to_hex(sig)
end

return _M
