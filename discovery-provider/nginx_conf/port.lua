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
    tcp:settimeout(1000)
    local res, err = tcp:connect(ip, port)
    tcp:close()
    if not res then
        ngx.log(ngx.ERR, "Could not connect tcp: ", err)
        return false
    end

    local udp = ngx.socket.udp()
    udp:settimeout(1000)
    local res, err = udp:setpeername(ip, port)
    if not res then
        ngx.log(ngx.ERR, "Could not peer udp: ", err)
        return false
    end

    return true
end

return _M