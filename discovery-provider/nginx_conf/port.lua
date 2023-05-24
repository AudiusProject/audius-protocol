require "resty.core"

local http = require "resty.http"
local socket = require "socket"

local _M = {}

function M.get_public_ip()
    local httpc = http.new()
    local res, err = httpc:request_uri("https://api.ipify.org")

    if not res then
        return nil
    end
    return res.body
end

function M.get_is_port_exposed(ip, port) {
    local tcp = assert(socket.tcp())
    tcp:settimeout(10)
    local res, err = tcp:connect(ip, port)
    local can_connect = false
    if res then
        can_connect = true
    end
    tcp:close()
    return can_connect
}

return _M