require "resty.core"

local cjson = require "cjson"

local limit_count = require "resty.limit.count"
local resty_http = require "resty.http"
local resty_random = require "resty.random"
local resty_rsa = require "resty.rsa"

local config = require "config"
local utils = require "utils"

-- Set seed for lua's random number generator by generating a random byte with openssl
math.randomseed(string.byte(resty_random.bytes(1)))

local _M = {}

local redirect_weights = {}

function update_redirect_weights (premature)
    if premature then
        return
    end

    ngx.log(ngx.NOTICE, "updating redirect weights")

    local httpc = resty_http.new()
    local res, err = httpc:request_uri("http://127.0.0.1:3000/redirect_weights", { method = "GET" })

    if not res then
        ngx.log(ngx.ERR, "failed to get redirect weights: ", err)
        return
    end

    redirect_weights = cjson.decode(res.body).data

    ngx.log(ngx.INFO, "cleared existing weights")
    for endpoint, weight in pairs(redirect_weights) do
        ngx.log(ngx.INFO, "set weight for endpoint ", endpoint, " to ", weight)
    end
end

function _M.start_update_redirect_weights_timer ()
    -- use lock to ensure that only one timer will run
    local locked = ngx.shared.locks:get("redirect_weights_timer")
    if locked == nil then
        ngx.shared.locks:set("redirect_weights_timer", true)
        ngx.log(ngx.NOTICE, "starting redirect weights timer")
        -- deplay first run by 10 seconds to ensure that discovery provider is running
        ngx.timer.at(10, update_redirect_weights)
        ngx.timer.every(config.update_redirect_weights_every, update_redirect_weights)
    end
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
    -- This works by allocating redirect_weights[endpoint] slots for every endpoint
    -- then generating a random number between 1 and total number of slots and finally
    -- returns the endpoint for the corresponding slot. This is done to favor redirecting
    -- to nodes with lower load
    -- Eg. if we have 2 endpoints with weights 5 and 10, then the total number of slots
    -- will be 15 and the random number will be between 1 and 15. If the random number is
    -- between 1 and 5, then the endpoint for slot 1 will be returned. If the random number
    -- is between 6 and 15, then the endpoint for slot 2 will be returned.
    local total = 0
    for endpoint, weight in pairs(redirect_weights) do
        total = total + weight
    end

    local rand = math.random(1, total)
    local current = 0
    for endpoint, weight in pairs(redirect_weights) do
        current = current + weight
        if rand <= current then
            return endpoint
        end
    end
end

function verify_signature (discovery_provider, nonce, signature)
    -- reject if all of the parameter are not provided
    if discovery_provider == nil and nonce == nil and signature == nil then
        return false
    end

    -- reject if one of the parameter is not provided
    if discovery_provider == nil or nonce == nil or signature == nil then
        ngx.log(
            ngx.WARN,
            "Signature verification failed: ",
            "discovery_provider=", discovery_provider,
            ", signature=", signature,
            ", nonce=", nonce
        )
        return false
    end

    -- reject if nonce was already used
    if ngx.shared.nonce_store:get(discovery_provider .. ";" .. nonce) then
        ngx.log(
            ngx.WARN,
            "Signature verification failed: ",
            "discovery_provider=", discovery_provider,
            ", signature=", signature,
            ", nonce=", nonce
        )
        return false
    end

    -- Allow all discovery providers for now instead of just whitelisted ones
    -- reject if discovery provider is not in the accept_redirect_from set
    -- if not config.accept_redirect_from[discovery_provider] then
    --     return false
    -- end

    local public_key, err = get_cached_public_key(discovery_provider)
    if not public_key then
        ngx.log(ngx.ERR, "failed to get rsa key: ", err)
        ngx.log(
            ngx.WARN,
            "Signature verification failed: ",
            "discovery_provider=", discovery_provider,
            ", signature=", signature,
            ", nonce=", nonce
        )
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
        ngx.log(
            ngx.WARN,
            "Signature verification failed: ",
            "discovery_provider=", discovery_provider,
            ", signature=", signature,
            ", nonce=", nonce
        )
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
    return config.delegate_owner_wallet, nonce, ngx.encode_base64(sig)
end

function _M.limit_to_rps ()
    if not config.rate_limiting_enabled then
        return
    end

    if ngx.req.get_method() == "OPTIONS" then
        return
    end

    if verify_signature(ngx.var.openresty_redirect_from_delegate_owner_wallet, ngx.var.openresty_redirect_nonce, ngx.var.openresty_redirect_sig) then
        -- if signature is correct remove signature args and skip rate limit logic
        local args, err = ngx.req.get_uri_args()
        if err then
            ngx.log(ngx.ERR, "failed to get uri args: ", err)
            return ngx.exit(500)
        end
        args.openresty_redirect_from_delegate_owner_wallet = nil
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
            args.openresty_redirect_from_delegate_owner_wallet, args.openresty_redirect_nonce, args.openresty_redirect_sig = get_redirect_args()
            ngx.req.set_uri_args(args)
            local redirect_target = get_redirect_target()
            if redirect_target ~= nil then
                local url = redirect_target .. ngx.var.request_uri
                ngx.log(
                    ngx.INFO,
                    "Redirecting: ",
                    "target=", url,
                    ", signature=", args.openresty_redirect_sig,
                    ", nonce=", args.openresty_redirect_nonce
                )
                return ngx.redirect(url)
            end
        end

        if rate_limit_hit == false then
            ngx.log(ngx.ERR, "failed to limit req: ", err)
            return ngx.exit(500)
        end
    end

    local remaining = err
    ngx.header["X-Redirect-Limit"] = config.limit_to_rps
    ngx.header["X-Redirect-Remaining"] = remaining
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

function _M.validate_nethermind_rpc_request ()
    if ngx.req.get_method() == "GET" or ngx.req.get_method() == "OPTIONS" then
        return
    end
    ngx.req.read_body()

    local data = ngx.req.get_body_data()
    if data then
        local body = cjson.decode(data)
        is_ok = utils.starts_with(body.method, "eth_") or utils.starts_with(body.method, "net_")

        if not is_ok then
            ngx.exit(405)
        end
    end
end

return _M
