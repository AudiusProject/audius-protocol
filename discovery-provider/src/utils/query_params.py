app_name_param = "app_name"

# query params to always exclude from key construction
exclude_param_set = {app_name_param}

def stringify_query_params(req_args):
    req_args = filter(lambda x: x[0] not in exclude_param_set, req_args)
    req_args = sorted(req_args)
    return f"&".join(["{}={}".format(x[0].lower(), x[1].lower()) for x in req_args])
