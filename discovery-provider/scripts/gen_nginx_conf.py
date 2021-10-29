#!/usr/bin/python3

import os


def main():
    print(
        """
worker_processes 1;

error_log logs/error.log;

events {
    worker_connections 1024;
}

http {
    lua_shared_dict my_limit_count_store 100m;

    init_worker_by_lua_block {
        require "resty.core"
        local resty_random = require("resty.random")
        local seed = string.byte(resty_random.bytes(1))
        math.randomseed(seed)
    }

    server {
        listen 5000;

        location ~* .*_(check|version) {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host            $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        location ~* .*v1\/resolve.* {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host            $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        location / {
"""
    )

    openresty_rps = int(os.getenv("audius_openresty_rps", "1000"))
    secondary = os.getenv("audius_secondary_disc_provs")

    if secondary:
        secondary = secondary.split(",")
        print(
            f"""
            access_by_lua_block {{
                if ngx.var.arg_no_redirect ~= "yes" then
                    local limit_count = require "resty.limit.count"

                    local lim, err = limit_count.new("my_limit_count_store", {openresty_rps}, 1)
                    if not lim then
                        ngx.log(ngx.ERR, "failed to instantiate a resty.limit.req object: ", err)
                        return ngx.exit(500)
                    end

                    local delay, err = lim:incoming("k", true)
                    if not delay then
                        if err == "rejected" then
                            local backendurl = ({{"{'","'.join(secondary)}"}})[math.random(1, {len(secondary)})]
                            local url = backendurl .. ngx.var.request_uri
                            url = url .. ((ngx.var.is_args == "?") and "&" or "?") .. "no_redirect=yes"
                            return ngx.redirect(url)
                        end

                        ngx.log(ngx.ERR, "failed to limit req: ", err)
                        return ngx.exit(500)
                    end
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
