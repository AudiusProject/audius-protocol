import random
import subprocess

import requests


def main():

    host = random.choice((requests.get("https://api.audius.co")).json()["data"])

    with open("../last_few.csv", "r") as f:
        for line in f:
            track_id = int(line.split(",")[0])

            # get track data
            track_response = requests.get(f"{host}/tracks?id={track_id}")
            if track_response.ok is not True:
                print(f"error response {track_id}: {track_response.status_code}")
                continue

            track_data = track_response.json()["data"][0]
            wallet = track_data["user"]["wallet"]
            user_id = track_data["user"]["user_id"]

            if len(track_data["track_segments"]) == 0:
                print(f"track doesn't have segents {track_id}")
                continue

            segment_cid = track_data["track_segments"][0]["multihash"]

            print(f"{wallet},{segment_cid}")

            encoded_user_id = (
                subprocess.check_output(f"hashids encode {user_id}".split())
                .strip()
                .split()[-1]
                .decode("utf-8")
            )
            user_response = requests.get(f"{host}/v1/full/users/{encoded_user_id}")
            if user_response.ok is not True:
                print(f"error response {encoded_user_id}: {user_response.status_code}")
                continue

            user_data = user_response.json()["data"][0]
            content_nodes = user_data["creator_node_endpoint"].split(",")
            content_node = content_nodes[0]

            # find copy320 on content nodes
            url = f"{content_node}/segment_to_cid"
            data = {
                "cid": segment_cid,
                "wallet": wallet,
            }
            print(f"{url} and {data}")
            copy320s_response = requests.post(
                url, data=data, headers={"Content-type": "application/json"}
            )

            if copy320s_response.ok is not True:
                print(
                    f"failed to find segment on content node {copy320s_response.status_code} - {str(copy320s_response)}"
                )
                continue

            print(copy320s_response.json())

    return


if __name__ == "__main__":
    main()
