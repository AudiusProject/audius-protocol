import json

with open("/Users/isaac/Desktop/QmdABo7WRpwtXXA2MNoE9mRRBaPyJheLoeHvM4AYB6YTum.json") as json_file:
    data = json.dumps(json.load(json_file), ensure_ascii=False).encode('utf-8', 'ignore').decode('utf-8', 'ignore')
    print(type(data))