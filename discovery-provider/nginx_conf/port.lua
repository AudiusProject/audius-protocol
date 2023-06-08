require "resty.core"

local http = require "resty.http"

local _M = {}

function _M.get_public_ip()
    local httpc = http.new()
    local res, err = httpc:request_uri("http://ipv4.icanhazip.com")

    if not res then
        ngx.log(ngx.ERR, "error: ", err)
        return nil
    end
    local ip = res.body
    ip = string.gsub(ip, "\\", "")
    ip = string.gsub(ip, " ", "")
    ip = string.gsub(ip, "\n", "")
    return ip
end

function _M.get_is_port_exposed(ip, port)
    local tcp = ngx.socket.tcp()
    tcp:settimeout(10)
    local res, err = tcp:connect(ip, port)
    tcp:close()
    if not res then
        ngx.log(ngx.ERR, "Could not connect tcp: ", err)
        return false
    end

    local udp = ngx.socket.udp()
    udp:settimeout(10)
    assert(udp:sendto("ping", ip, port))
    local res, err = udp:receive()
    if not res then
        ngx.log(ngx.ERR, "Could receive udp message: ", err)
        return false
    end
    if res != "pong" then
        ngx.log(ngx.ERR, "Received wrong udp message: ", res)
        return false
    end

    return true
end

function _M.udp_heartbeat()
    local sock, err = ngx.req.socket(true)
    if not sock then
        ngx.log(ngx.ERR, "failed to get the request socket: ", err)
        return
    end

    local data, err, partial = sock:receive()
    if not data then
        data = partial
        if not data then
            ngx.log(ngx.ERR, "failed to receive the data: ", err)
            return
        end
    end

    ngx.log(ngx.INFO, "Received udp: ", data)

    local bytes, err = sock:send("pong")
    if not bytes then
        ngx.log(ngx.ERR, "failed to send: ", err)
    end
end

return _M