
import random
import requests
import subprocess
import pandas as pd
import numpy as np

import asyncio

def background(f):
    def wrapped(*args, **kwargs):
        return asyncio.get_event_loop().run_in_executor(None, f, *args, **kwargs)

    return wrapped

@background
def process(index, trackId):
    host = random.choice((requests.get('https://api.audius.co')).json()['data'])
    result = subprocess.run(["hashids", "encode", trackId], stdout=subprocess.PIPE)
    raw_text = result.stdout
    encodedId = str(raw_text.strip()).split()[-1].strip("'")

    resp = requests.get(f"{host}/v1/full/tracks/{encodedId}")
    if resp.status_code != 200:
        with open("../missing_for_no_reason.csv", "a") as why:
            print(f"{index}: {trackId} ({encodedId}) : {resp.status_code}")
            why.write(f"{trackId},{encodedId},{resp.status_code}\n")
            return

    with open("../missing_with_extra.csv", "a") as fw:
        json_output = resp.json()
        creator_nodes = json_output["data"]["user"]["creator_node_endpoint"]
        permalink = json_output["data"]["permalink"]

        fw.write(f"{trackId},{encodedId},{permalink},{creator_nodes}\n")

def check_cnodes():
    df = pd.read_csv("../missing_with_extra.csv", header=None)
    print(
        np.unique(
            np.concatenate([
                df[3].unique(), 
                df[4].unique(), 
                df[5].unique(),
            ])
        )
    )

def make_cn_request(url, trackId, encodedId):
    with open("../2-final_final_mapping.csv", "a") as pls:
        url = f"{url}/tracks/stream/{encodedId}"
        response = requests.get(url)
        copy320 = response.headers["Copy320-CID"]
        print(f"{url} => {copy320}")
        pls.write(f"{trackId},{copy320}\n")

@background
def get_copy320_from_headers(row):
    try:
        try:
            make_cn_request(row[3], row[0], row[1])
        except:
            try:
                make_cn_request(row[4], row[0], row[1])
            except:
                make_cn_request(row[5], row[0], row[1])
    except:

        with open("../2-no_in_headers.csv", "a") as sin_encabezados:
            sin_encabezados.write(f"{row[0]},{row[1]}\n")

def de_encabezados():
    # df = pd.read_csv("../missing_with_extra.csv", header=None)
    df = pd.read_csv("../1-no_in_headers.csv", header=None)

    for index, row in df.iterrows():
        get_copy320_from_headers(row)

def combine_headers_and_backfill():
    backfill = pd.read_csv("../combined_combined_track_cids.csv")
    headers = pd.read_csv("../1-final_final_mapping.csv")

    combined = pd.concat([backfill, headers])
    combined = combined.groupby(combined.track_id).first()

    print(combined)

    combined.to_csv('../combined_combined_combined_track_cids.csv')

def are_there_duplicates():
    df = pd.read_csv("../all_track_ids.csv")
    print(len(df["TrackId"].unique()))


def fix_missing_no_reason():
    original = pd.read_csv("../missing_with_extra.csv")
    not_in_headers = pd.read_csv("../no_in_headers.csv")
    
    thefix = original[original['track_id'].isin(not_in_headers['track_id'])].sort_values(by=['track_id'])

    thefix = thefix.drop_duplicates(subset=['track_id'])

    thefix.to_csv("../fixed_no_in_headers.csv", index=False, header=False)

def main():
    with open("../missing_cids.csv", "r") as f:
        data = f.read()

        trackIds = data.split("\n")

        for i, trackId in enumerate(trackIds):
            process(i, trackId)

if __name__ == "__main__":
    # main()
    # check_cnodes()
    de_encabezados()
    # combine_headers_and_backfill()
    # are_there_duplicates()
    # fix_missing_no_reason()