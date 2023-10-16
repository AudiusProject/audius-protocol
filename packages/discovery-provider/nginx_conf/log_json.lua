local json = require("cjson.safe")

local function log_json()
    local log_data = {
        remote_addr = ngx.var.remote_addr,
        time_local = ngx.var.time_local,
        request = ngx.var.request,
        status = ngx.var.status,
        body_bytes_sent = ngx.var.body_bytes_sent,
        http_referer = ngx.var.http_referer,
        http_user_agent = ngx.var.http_user_agent,
        request_time = ngx.var.request_time
    }
    local serialized_data, err = json.encode(log_data)
    if not err then
        ngx.log(ngx.NOTICE, serialized_data)
    else
        ngx.log(ngx.ERR, "Failed to encode log data to JSON: ", err)
    end
end

return log_json()
