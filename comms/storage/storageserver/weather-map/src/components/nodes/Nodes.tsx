import { Link } from 'react-router-dom'

import { HostAndShards } from '../../api'

export default function Nodes({
  hostsAndShards,
}: {
  hostsAndShards: { [pubKey: string]: HostAndShards }
}) {
  function truncatePubKey(pubKey: string) {
    if (pubKey.length <= 12) return pubKey
    return pubKey.slice(0, 6) + '...' + pubKey.slice(-6)
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(hostsAndShards).map((pubKey) => (
          <li
            key={pubKey}
            className="col-span-1 max-h-32 divide-y divide-gray-200 overflow-y-scroll rounded-lg bg-white shadow-md"
          >
            <div className="w-full items-center justify-between space-x-6 p-6">
              <div className="flex-1 truncate">
                <div className="flex items-center space-x-3">
                  <h3 className="truncate text-sm font-medium text-gray-900">
                    {hostsAndShards[pubKey].host} (
                    <a
                      href={`${hostsAndShards[pubKey].host}/nats`}
                      target="_blank"
                      className="font-medium text-blue-600 underline hover:no-underline dark:text-blue-500"
                      rel="noreferrer"
                    >
                      nats
                    </a>
                    ,{' '}
                    <a
                      href={`${hostsAndShards[pubKey].host}/storage`}
                      target="_blank"
                      className="font-medium text-blue-600 underline hover:no-underline dark:text-blue-500"
                      rel="noreferrer"
                    >
                      upload
                    </a>
                    )
                  </h3>
                </div>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {truncatePubKey(pubKey)}
                </p>
              </div>

              <div className="center text-center">
                {hostsAndShards[pubKey].shards.map((shard) => (
                  <span key={`${pubKey}_${shard}`}>
                    <Link
                      to={`/shard/${shard}`}
                      className="mx-1 my-1 inline-block max-w-sm flex-shrink-0 rounded-full border border-gray-100 bg-gray-300 p-6 px-2 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-100"
                    >
                      {shard}
                    </Link>
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
