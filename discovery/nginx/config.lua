local resty_rsa = require "resty.rsa"

local utils = require "utils"

local limit_to_rps = os.getenv("audius_openresty_rps") or "1000"
local delegate_owner_wallet = os.getenv("audius_delegate_owner_wallet") or ""
-- accept_redirect_from is a whitelist of all discovery node delegate wallets that this discovery
-- node will accept a redirection from.
-- local accept_redirect_from = os.getenv("audius_openresty_accept_redirect_from") or ""
local rsa_public_key = os.getenv("audius_openresty_rsa_public_key") or ""
local rsa_private_key = os.getenv("audius_openresty_rsa_private_key") or ""
local update_redirect_weights_every = os.getenv("audius_openresty_update_redirect_weights_every") or "300"

local registered_plugins = os.getenv("REGISTERED_PLUGINS") or ""

if rsa_public_key == "" or rsa_private_key == "" then
    ngx.log(ngx.WARN, "audius_openresty_rsa_private_key or audius_openresty_rsa_public_key was not set; generating new key")
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


local _M = {}
_M.limit_to_rps = tonumber(limit_to_rps)
ngx.log(ngx.NOTICE, "limit_to_rps=", limit_to_rps)

_M.delegate_owner_wallet = delegate_owner_wallet
ngx.log(ngx.NOTICE, "delegate_owner_wallet=", delegate_owner_wallet)

-- _M.accept_redirect_from = utils.toset(utils.split_on_comma(accept_redirect_from))

_M.rsa_public_key = rsa_public_key

_M.rsa_private_key = rsa_private_key

_M.private_key = private_key

-- Disable rate limiting if there are no redirect targets or delegate_owner_wallet is not set
_M.rate_limiting_enabled = delegate_owner_wallet ~= ""
ngx.log(ngx.NOTICE, "rate_limiting_enabled=", _M.rate_limiting_enabled)

_M.update_redirect_weights_every = tonumber(update_redirect_weights_every)
ngx.log(ngx.NOTICE, "update_redirect_weights_every=", update_redirect_weights_every)

_M.registered_plugins = registered_plugins

return _M