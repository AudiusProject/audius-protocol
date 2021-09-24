#!/bin/python3

import os


def main():
    print(
        """
worker_processes  1;

error_log logs/error.log;

events {
    worker_connections 1024;
}

http {
    lua_shared_dict my_limit_req_store 100m;

    init_worker_by_lua_block {
        local resty_random = require('resty.random')
        local seed = string.byte(resty_random.bytes(1))
        math.randomseed(seed)
    }

    server {
        listen 5000;

        location = /health_check {
            proxy_pass http://127.0.0.1:3000;
        }

        location / {
"""
    )

    secondary = os.getenv("audius_secondary_disc_provs")
    if secondary:
        secondary = secondary.split(",")
        print(
            f"""
            access_by_lua_block {{
                local limit_req = require "resty.limit.req"

                local lim, err = limit_req.new("my_limit_req_store", 10, 20)
                if not lim then
                    ngx.log(ngx.ERR, "failed to instantiate a resty.limit.req object: ", err)
                    return ngx.exit(500)
                end

                local key = ngx.var.binary_remote_addr
                local delay, err = lim:incoming(key, true)
                if not delay then
                    if err == "rejected" then
                        local backendurl = ({{"{'","'.join(secondary)}"}})[math.random(1, {len(secondary)})]
                        return ngx.redirect("http://" ..  backendurl .. ngx.var.request_uri)
                    end
                    ngx.log(ngx.ERR, "failed to limit req: ", err)
                    return ngx.exit(500)
                end

                if delay >= 0.001 then
                    ngx.sleep(delay)
                end
            }}
"""
        )

    print(
        """
            proxy_pass http://127.0.0.1:3000;
        }
    }
}
"""
    )


if __name__ == "__main__":
    main()
