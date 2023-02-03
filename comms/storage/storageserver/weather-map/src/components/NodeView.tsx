import axios from "axios";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

export default function NodeView() {
  type HostAndBuckets = {
    host: string;
    buckets: string[];
  };
  const { isLoading, error, data, isFetching } = useQuery<string, string, {[pubKey: string]: HostAndBuckets}>("nodesToBuckets", () =>
    {
      return axios.get(
        "http://localhost:9924/storage/nodes-to-buckets"
      ).then((res) => res.data);
    }
  );

  if (isLoading) return <>Loading...</>;

  if (error) return <>An error has occurred: ${error}</>;

  return (
    <div>
      <h1>Nodes Overview</h1>
      <div>{isFetching ? "Fetching..." : ""}</div>
      <ul>
        {data && Object.keys(data).map((pubKey, i) =>
          (
            <li key={pubKey}>
              <a href={`${data[pubKey].host}/nats`}>{data[pubKey].host}/nats</a>: {data[pubKey].buckets.map((bucket, i) => (
                <span key={bucket}>
                  {i > 0 && ", "}
                  <Link to={`http://localhost:9924/storage/weather/bucket/${bucket}`}>{bucket}</Link>
                </span>
            ))}
            <br />
            </li>
          )
        )}
      </ul>
    </div>
  );
}