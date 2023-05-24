require "resty.core"

local http = require "resty.http"
local socket = require "socket"

local _M = {}

function _M.get_public_ip()
    local httpc = http.new()
    local res, err = httpc:request_uri("https://api.ipify.org")

    if not res then
        return nil
    end
    return res.body
end

function _M.get_is_port_exposed(ip, port)
    local tcp = socket.tcp()
    tcp:settimeout(10)
    local res, err = tcp:connect(ip, port)
    tcp:close()
    if not res then
        ngx.log(ngx.ERR, "Could not connect: ", err)
        return false
    else
        return true
    end
end

return _M