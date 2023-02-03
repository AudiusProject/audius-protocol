import axios from "axios";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";

type KeyAndMd5 = {
  key: string;
  md5: string;
}

export default function BucketView() {
  type HostAndBuckets = {
    host: string;
    buckets: string[];
  };
  const { isLoading: isLoadingHosts, error: errorHosts, data: dataHosts, isFetching: isFetchingHosts } = useQuery<string, string, {[pubKey: string]: HostAndBuckets} | null>("nodesToBuckets", () =>
    {
      return axios.get(
        "http://localhost:9924/storage/nodes-to-buckets"
      ).then((res) => res.data);
    }
  );

  const { bucket } = useParams();

  if (isLoadingHosts) return <>Loading...</>;
  if (errorHosts) return <>An error has occurred: ${errorHosts}</>;
  if (!bucket) return <>No bucket specified in path param</>;
  if (!dataHosts || Object.keys(dataHosts || {}).length === 0) return <>No dataHosts</>;

  const hosts = dataHosts && Object.keys(dataHosts).map((pubKey, i) => {
    const { isLoading, error, data, isFetching } = useData(bucket, dataHosts[pubKey].host);
    if (isLoading) return <>Loading...</>;
    if (error) return <>An error has occurred: ${error}</>;
    if (isFetching) return <>Fetching...</>;
    if (!data || Object.keys(data || {}).length === 0) return <>No data</>;
    return (
      <>
        <a href={`${dataHosts[pubKey].host}/nats`}>{dataHosts[pubKey].host}/nats</a>:
        <ul>
          {data?.map((keyAndMd5, i) => (
            <li key={keyAndMd5.key}>
              {keyAndMd5.key} (MD5: {keyAndMd5.md5}) [<a href={`${getStorageHostFromNatsHost(dataHosts[pubKey].host)}/storage/long-term/${keyAndMd5.key}`}>file</a>]
            </li>
          ))}
        </ul>
      </>
    )
  });

  return (
    <div>
      <h1>Bucket Overview ({bucket})</h1>
      Nodes storing this bucket:
      <div>{isFetchingHosts ? "Fetching..." : ""}</div>
      <ul>
        {hosts?.map((host, i) => <li>{host}</li>)}
      </ul>
    </div>
  );
}

function useData(bucket: string, host: string) {
  const { isLoading, error, data, isFetching } = useQuery<string, string, KeyAndMd5[] | null>(`keysAndMd5sIn${bucket}_${host}`, () =>
  {
    return axios.get(
      `${getStorageHostFromNatsHost(host)}/storage/long-term/${bucket}?includeMD5s=true`
    ).then((res) => res.data);
  });
  return { isLoading, error, data, isFetching };
}

function getStorageHostFromNatsHost(natsHost: string) {
  const natsPort = natsHost.slice(-4);
  // Convert natsPort from string to number, add 1000, and convert back to string
  const storageApiPort = parseInt(natsPort, 10) + 1000
  console.log(`http://localhost:${storageApiPort}`)
  return `http://localhost:${storageApiPort}`;
}