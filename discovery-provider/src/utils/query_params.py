app_name_param = "app_name"

# query params to always exclude from key construction
exclude_param_set = {app_name_param}

# req_arg_items should be an array of [[key, val]]
def stringify_query_params(req_arg_items):
    req_arg_items = filter(lambda x: x[0] not in exclude_param_set, req_arg_items)
    req_arg_items = sorted(req_arg_items)
    return "&".join(
        ["{}={}".format(x[0].lower(), str(x[1]).lower()) for x in req_arg_items]
    )
