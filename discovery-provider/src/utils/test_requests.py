import asyncio
import concurrent.futures
import time

import aiohttp
import requests

gateway_endpoints = [
    "https://content-node.audius.co/ipfs/",
    "https://creatornode2.audius.co/ipfs/",
    "https://creatornode2.audius.co/ipfs/",
]

multiply_factor = 1
cids = [
    "QmZv9dWJ7aDSSMwaYTTMuAL3shRufANwx2R13dY5afBEjt",
    "QmW9gTgAscTaSpb4954QQdwztTSDCCRg1uds18GnYHk2BK",
    "Qmaj5Mgo8zUsHDGGdimzhYC1KEnyoE3gAoeUKRMY6tymLU",
    "QmXGiKTr6qrWzEU5YyLL748U7BqoUyG4r85HEsacY5sqCM",
    "Qmckz5yaGgck3CwmkSPsDcmtQvQTRkMLdckEF77YCco95S",
    "QmdLJELJP38nuePNiNci4m6hmPsUQtSw1LT5mPv5GENwoR",
    "QmVdA83QRHWQfTUR1XjEAjtnSBcummWykfoLvqy76urCui",
    "QmeKvti1dm6Z3zCccPr3DnzVCPZyjvW9ZGoZcC5Uu9qAbx",
    "QmdqZz22dxrYDUrGSkSc2G3xi39F8nTEFEJry8YcEw2iAu",
    "QmeKAXTcfQ3pWKf93qUUiytQvUjM67ALZg67GpJrPzYgNS",
    "QmdKt68NyDCw6UWZAwJ1R1j5BFEDmKANrHH8Sqn8Eg6nwC",
    "QmdKt68NyDCw6UWZAwJ1R1j5BFEDmKANrHH8Sqn8Eg6nwC",
    "QmQXYb5kz64brYdgkEG7T6NsujTPXVYz3Ea5k9xAGLzUXp",
    "QmSdyLtCZs6rxNEnQSgjsKo2DBHa4N2o2TcW7YdhjahzxJ",
    "QmWM3SY22KCLTTyzqHjkT7STAAupppAHAPA6T1Hfvd1t89",
    "QmTHySXhWQbrqfqbpjmGkErSWMTdtyC5xuDGAZTAG61fDR",
    "QmQapi4DwcoPZNdwHFgWmXtj4tFN6yLmbLxEnCofbkDCXn",
    "QmQapi4DwcoPZNdwHFgWmXtj4tFN6yLmbLxEnCofbkDCXn",
    "QmNsUtAuvpV4QKHtQ7qKpwsop3usUMQ9dZXSTMiXE7DaGJ",
    "QmXd2hqPbekTqVzCkVHd63q9ZoTZ9RCVzdPpvgw6FyZKLD",
    "QmcGuTDt226TgmmFCz7Z4oCvCqmaC8Tvb8u3JUVi7r9feJ",
    "QmcGuTDt226TgmmFCz7Z4oCvCqmaC8Tvb8u3JUVi7r9feJ",
    "QmeAeLG29ZHoCzSbg2bQ9VFhh9u37G612MXiNaZmUinSuj",
    "QmcacJPnkofswGTHEXu8ABcSQT1oxGBm23UHab3JujzDn9",
    "QmPTpHRZtxNJxpRxvXkSLvL2nvCqbLaPurkjJLTMbBCFBd",
    "QmPTpHRZtxNJxpRxvXkSLvL2nvCqbLaPurkjJLTMbBCFBd",
    "QmesTyCuJWPmTrWfZae4cxSpotB427UvpaUR5pf8WvfyxD",
    "QmeBs7dyYQWwaWk3dfs4qMpofvw7FcHZAropybvViwpPTq",
    "QmSAoftexzR3jNgEBNS6cVLScWgdMS9CRcPfXS27hJogAr",
    "QmZVkSgzMyugAEPjGHE1RPBG3THSwmxNmuJQs7ara9iB6q",
    "QmZVkSgzMyugAEPjGHE1RPBG3THSwmxNmuJQs7ara9iB6q",
    "QmT5N5fvTmJ9qavcjh5qqbMZK2gSLswmdNgJKgbP5CkRe3",
    "QmSbkFHk6uddGfmoN4VLGXaZZcjy1SHgdhAosNQhfPDYrc",
    "QmT5N5fvTmJ9qavcjh5qqbMZK2gSLswmdNgJKgbP5CkRe3",
    "Qmdk4HER3kFsQJZ9CSsp1bT1zqdqjQfUWKby9kPY7PnFrE",
    "Qmdk4HER3kFsQJZ9CSsp1bT1zqdqjQfUWKby9kPY7PnFrE",
    "QmV6NBX8fgUwVncym5ft7TYHYrEAwFMU5FJgrbZHmQrUyT",
    "QmepKwyxmjaqXNMvVQRVC6AUHhNKXCt9NJ7Ng2B9AMWDta",
    "QmdqfmRSdxL1sm5vfWVYMkrXMa1ea2gM26W1d6ZkRr499C",
    "QmepKwyxmjaqXNMvVQRVC6AUHhNKXCt9NJ7Ng2B9AMWDta",
    "QmdRma7nT5wqkx69vBRT6qzDiu3EwVxf9YSCzjk6gJXAUs",
    "QmSo6wbbKoPVRQf9onY2xm8prLjriNG7HxZL8vRzVjCJGs",
    "QmPP35vAKd9LKyaPhx2yWJuWzGgDEqzyRdjW8ejjn3Z9ZX",
    "QmVdwvXEeApMsLRRL7JiiMYJMdfSwS7XssbHLjyrTysGEA",
    "QmdRma7nT5wqkx69vBRT6qzDiu3EwVxf9YSCzjk6gJXAUs",
    "QmQWQBQiauLd8GAsN6yhkwUaZyvgvP1PpbQzZzCRsKErDP",
    "QmaMLMG24jhfprwspE8szYLoVmy3nFzaZfDZJfAA7KThCq",
    "QmaMLMG24jhfprwspE8szYLoVmy3nFzaZfDZJfAA7KThCq",
    "QmaReJVzSgThrC93sW5bTLwSNoWRtDiNSo7yeByQMhN1Fj",
    "QmPuU7BhDsxmJpXHo9xDNDUJbHmT6YgfestxqdPXJZVqyi",
    "QmYvuPZbTfHftKSABYvKd6Uev4oZcHwrtsaAH9L7WEnRid",
    "QmcLPVXfzJHxUGTmUa5h1SynN2vem5ha8aKNp6v2jB5Vco",
    "QmaMJdM6UYbEps6z93AfD9kkdKawfwjWLCUpbjNp3Gep1k",
    "Qma63YBHeKVGQK9e7YwPDsBqgxzgihujrkGPL77hNPpZHL",
    "QmYvuPZbTfHftKSABYvKd6Uev4oZcHwrtsaAH9L7WEnRid",
    "Qma63YBHeKVGQK9e7YwPDsBqgxzgihujrkGPL77hNPpZHL",
    "QmbhGTLsFvjas3toxokpc2ZfR3fhNDhr5KT9i3aAqreo2C",
    "QmbNHPRQGFPxYYzEd8Pk2PPcdPNUq2F2SgTt9yjwBaZ6Na",
    "Qmc6WQ6qQmcnz7JxuzqSDfgq5Dxm9cLYZqTBocDLz42vd2",
    "QmPXeCFfrmJy1ngZ843WoBpatPV58D5m6NzuvyQYykygrW",
    "QmPXeCFfrmJy1ngZ843WoBpatPV58D5m6NzuvyQYykygrW",
    "QmYkVJYtAASZjd69SXXh4etTAGsYB6rD3BBX8ekYAhAmM5",
    "QmXL4qoaKcmc1ChydBLJZKpKQwUDmhKttAXNGVpc7wr57b",
    "QmYkVJYtAASZjd69SXXh4etTAGsYB6rD3BBX8ekYAhAmM5",
    "QmdUq1nUra6KoSrD3MircbNdQqa3ahTssEyNnD3WN65sZK",
    "QmRE7K8WNX7yUprsroSriS1UKYXa43qShuJkpm36JcwL5A",
    "QmZU4Zp513MaY6ho3K1Ckx5QxDixsgrsjYLwT2XvY2CqZU",
    "QmXidzEFdVaxHofTc5HnGUqiyZHZTWXw9SCMkNxbgTdwW5",
    "QmTTLLjkcC9EQErbvMXgxUHPEGVt3onL3ct1RcS54sw2o2",
    "QmdUq1nUra6KoSrD3MircbNdQqa3ahTssEyNnD3WN65sZK",
    "QmTTLLjkcC9EQErbvMXgxUHPEGVt3onL3ct1RcS54sw2o2",
    "QmWKA2F2KH9UwCM8XkNAfh23SgZzs5QR4bFkmq4qECg1Ni",
    "QmUemnLNpMsJWsqpAoEYk5nexS5fkM3Bd2R66EJKWMTVVn",
    "QmUemnLNpMsJWsqpAoEYk5nexS5fkM3Bd2R66EJKWMTVVn",
    "QmUHDEu2Y7cwKxZjSXZW6FJvUFyarpi5qksoLV96Zg1cp4",
    "QmZLsckdQg6JFZpV7VdRijdmg72yrh38H9sP3jd3EsN1Zg",
    "QmUR2LCApzERTHkVqgL2WPnCKAZMFvoXLEYdEcsbWAw5xe",
    "QmZLsckdQg6JFZpV7VdRijdmg72yrh38H9sP3jd3EsN1Zg",
    "QmPgWpHetaj5LwpBajV9qX5vDLBwHxJSunvpYN2ZoV6qbs",
    "QmagdZmo7PxkdVwPBDParpcLFJELn4npsPJYiNMmtJwUM7",
    "QmagdZmo7PxkdVwPBDParpcLFJELn4npsPJYiNMmtJwUM7",
    "QmcBPNDZHNxQh8F6CDHeWnTPGbXEbFMDpQ1mqeMhhv8wXw",
    "Qmf7DPs12vwa5Z29P1a7xHTCRheGWbYB13BtkGT5ha8umT",
    "QmP4N1R8oAt38FtNuo1gcGqA7wJStZ8VDa9zfEC2SF57LC",
    "QmVxgwapBwj8UuWNktjVe1NKdvDg1WN4HL3AGCRkgXLoN3",
    "QmW8b48mVuHfSHwZ758jAFzYnmX6DiniPCcPHDUeKb74Wv",
    "QmbPjWN2gTxSiRPGABEVk452VTF35Zw6sucae6LGjrEQDQ",
    "QmbPjWN2gTxSiRPGABEVk452VTF35Zw6sucae6LGjrEQDQ",
    "QmP4KeAt8JHjnQ8JZfa8SM41fNBMrfMykefU4NUVyoPCrE",
    "QmaTmfDMNDSm8kZw86ov3MNRzZMHGbWuvTRHt2nFfNJn8b",
    "QmP4KeAt8JHjnQ8JZfa8SM41fNBMrfMykefU4NUVyoPCrE",
    "QmbXL4RSr4r7uMJYznTrod2bM6NmEMcZzCwqkirruixbxS",
    "QmbXL4RSr4r7uMJYznTrod2bM6NmEMcZzCwqkirruixbxS",
    "QmVgSeJ3kH5oVkgW2i7H7caDCYSmb69qhEddukjc1Ypp7M",
    "QmZw1BHRKnLDAJERQfYhfMp1We5Hy9NALz4iR3gYWrZGVp",
    "QmRK3qZfJERWuJAtAFUQjzuXw4x1khhHNQxNGcJvFCD9Qn",
    "QmZw1BHRKnLDAJERQfYhfMp1We5Hy9NALz4iR3gYWrZGVp",
    "QmdN26GUZViyPgcYY8qMa8zrw7ZZCXNYRQbTnAinGwiToq",
    "QmZ4chM3t85zvEsh1zciEiKj4A4WE3xYwS8otAh6zVn4Am",
    "QmeYnmF34FLK8poUfknW8RakBJUnB4RwyrhMshYasxd2rc",
] * multiply_factor


def index():
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_cid = {executor.submit(get_metadata, cid): cid for cid in cids}
        start_time = time.time()
        for future in concurrent.futures.as_completed(future_to_cid):
            pass
            # print(
            #     f"index | got CID metadata {future_to_cid[future]} in {time.time() - start_time}"
            # )
        # print(f"index | finished all fetching in {time.time() - start_time}")


def get_metadata(cid):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        for gateway_endpoint in gateway_endpoints:
            url = gateway_endpoint + cid
            future_to_url = {executor.submit(load_metadata_url, url): url}
        for future in concurrent.futures.as_completed(future_to_url):
            # print(future)
            response = future.result()
            # print(f"response: {response}")
            if response.status_code == 200:
                # print(
                #     f"get_metadata | got {future_to_url[future]} from cache {response.headers['CF-Cache-Status'] if 'CF-Cache-Status' in response.headers else 'Not using cloudflare'}"
                # )
                return future.result()
            # print(f"get_metadata | {future_to_url[future]} got {response.status_code}")


def load_metadata_url(url):
    try:
        return requests.get(url, timeout=15)
    except Exception as e:
        print(e)


async def index_async():

    async with aiohttp.ClientSession() as session:

        tasks = []
        for cid in cids:
            tasks.append(asyncio.ensure_future(get_metadata_async(session, cid)))
        await asyncio.gather(*tasks)


async def get_metadata_async(session, cid):

    for gateway_endpoint in gateway_endpoints:
        url = gateway_endpoint + cid
        async with session.get(url) as resp:
            status_code = await resp.json(content_type=None)
            if status_code == 200:
                return status_code


async_start_time = time.time()
# asyncio.run(index_async())
index()
print(f"takes {time.time() - async_start_time} seconds")
