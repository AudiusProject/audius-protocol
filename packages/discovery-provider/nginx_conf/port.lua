require "resty.core"

local http = require "resty.http"

local _M = {}

function _M.get_public_ip()
    local httpc = http.new()
    local ip_services = {
        "http://ipv4.icanhazip.com",
        "http://ipv4bot.whatismyipaddress.com",
        "http://checkip.amazonaws.com",
        "http://ipinfo.io/ip",
        "http://api.ipify.org"
    }

    for _, url in ipairs(ip_services) do
        local res, err = httpc:request_uri(url)
        if res then
            local ip = res.body
            ip = string.gsub(ip, "\\", "")
            ip = string.gsub(ip, " ", "")
            ip = string.gsub(ip, "\n", "")
            if ip and ip ~= "" then
                return true, ip
            end
        else
            ngx.log(ngx.ERR, "Error contacting ", url, ": ", err)
        end
    end

    return false, "Could not get external IP"
end

function _M.get_is_port_exposed(ip, port)
    local tcp = ngx.socket.tcp()
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