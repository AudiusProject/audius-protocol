require "resty.core"

local limit_count = require "resty.limit.count"
local resty_http = require "resty.http"
local resty_random = require "resty.random"
local resty_rsa = require "resty.rsa"

local config = require "config"
local utils = require "utils"

-- Set seed for lua's random number generator by generating a random byte with openssl
math.randomseed(string.byte(resty_random.bytes(1)))

local _M = {}

local redirect_target_weights = {}
for index, redirect_target in ipairs(config.redirect_targets) do
    redirect_target_weights[redirect_target] = 1
end

function get_request_counts (discovery_providers)
    local httpc = resty_http.new()
    request_counts = {}

    for index, discovery_provider in ipairs(discovery_providers) do
        local res, err = httpc:request_uri(discovery_provider .. "/health_check", { method = "GET" })

        if not res then
            ngx.log(ngx.ERR, "failed to get request count from discovery provider: ", discovery_provider, err)
            request_count[discovery_provider] = -1
        else
            request_count[discovery_provider] = tonumber(res.body)
        end
    end

    return request_counts
end

function update_redirect_target_weights (premature)
    if premature then
        return
    end

    local request_count = get_request_counts(config.redirect_targets)

    local maximum_request_count = 0
    for discovery_provider, count in pairs(request_count) do
        maximum_request_count = math.max(maximum_request_count, count)
    end

    for discovery_provider, count in pairs(request_count) do
        if count ~= -1 then
            redirect_target_weights[discovery_provider] = (2 * maximum_request_count) - count
        else
            redirect_target_weights[discovery_provider] = 0
        end
    end
end

function _M.start_update_redirect_target_weights_timer ()
    ngx.timer.every(config.update_redirect_weights_every, update_redirect_target_weights)
end

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

function get_redirect_target ()
    local total = 0
    for index, redirect_target in ipairs(config.redirect_targets) do
        total = total + redirect_target_weights[redirect_target]
    end

    local rand = math.random(1, total)

    local current = 0
    for index, redirect_target in ipairs(config.redirect_targets) do
        current = current + redirect_target_weights[redirect_target]
        if rand <= current then
            return redirect_target
        end
    end

    -- choose randomly if all nodes have weight 0
    return config.redirect_targets[math.random(1, #config.redirect_targets)]
end

function verify_signature (discovery_provider, nonce, signature)
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
    else
        ngx.log(ngx.ERR, "invalid signature: signature=", signature, ", nonce=", nonce, ", discovery_provider=", discovery_provider)
    end

    return ok
end

function get_redirect_args ()
    local nonce = utils.generate_nonce()
    local sig, err = config.private_key:sign(nonce)
    if not sig then
        ngx.log(ngx.ERR, "Failed to sign nonce for redirect: ", err)
        return
    end
    return config.public_url, nonce, ngx.encode_base64(sig)
end

function _M.limit_to_rps ()
    if not config.rate_limiting_enabled then
        return
    end

    if verify_signature(ngx.var.openresty_redirect_from, ngx.var.openresty_redirect_nonce, ngx.var.openresty_redirect_sig) then
        -- if signature is correct remove signature args and skip rate limit logic
        local args, err = ngx.req.get_uri_args()
        if err then
            ngx.log(ngx.ERR, "failed to get uri args: ", err)
            return ngx.exit(500)
        end
        args.openresty_redirect_from = nil
        args.openresty_redirect_nonce = nil
        args.openresty_redirect_sig = nil
        ngx.req.set_uri_args(args)
        return
    end

    -- limit_count.new(store, count, time_window in seconds)
    local lim, err = limit_count.new("limit_count_store", config.limit_to_rps, 1)
    if not lim then
        ngx.log(ngx.ERR, "failed to instantiate a resty.limit.req object: ", err)
        return ngx.exit(500)
    end

    -- set a dummy key since we are not rate limiting separately for each user
    -- lim:incoming(key, no_dry_run)
    local delay, err = lim:incoming("k", true)
    if not delay then
        local rate_limit_hit = err == "rejected"
        if rate_limit_hit then
            -- Redirect request after setting redirect args
            local args, err = ngx.req.get_uri_args()
            args.openresty_redirect_from, args.openresty_redirect_nonce, args.openresty_redirect_sig = get_redirect_args()
            ngx.req.set_uri_args(args)
            local url = get_redirect_target() .. ngx.var.request_uri
            return ngx.redirect(url)
        end

        ngx.log(ngx.ERR, "failed to limit req: ", err)
        return ngx.exit(500)
    end
end

function _M.mark_request_processing ()
    local rcount_key = "request-count"
    local rcount_step_value = 1
    local rcount_init_value = 0
    ngx.shared.request_count:incr(rcount_key, rcount_step_value, rcount_init_value)
end


function _M.mark_request_processed ()
    local rcount_key = "request-count"
    local rcount_step_value = -1
    local rcount_init_value = 0
    ngx.shared.request_count:incr(rcount_key, rcount_step_value, rcount_init_value)
end

return _M
