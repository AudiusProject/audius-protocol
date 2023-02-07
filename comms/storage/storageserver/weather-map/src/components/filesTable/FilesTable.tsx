import type { ErrorRow as ErrorRowType } from './ErrorRow'
import ErrorRow from './ErrorRow'
import type { HealthyRow as HealthyRowType } from './HealthyRow'
import HealthyRow from './HealthyRow'

export default function FilesTable({
  errorRows,
  healthyRows,
}: {
  errorRows: ErrorRowType[]
  healthyRows: HealthyRowType[]
}) {
  const sortedErrorRows = errorRows.sort((a, b) => a.fileName.localeCompare(b.fileName))
  const sortedHealthyRows = healthyRows.sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
  )
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr className="divide-x divide-gray-200">
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-4 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      File Name
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      File on Nodes
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      MD5
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-4 text-left text-sm font-semibold text-gray-900 sm:pr-6"
                    >
                      Job
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedErrorRows
                    .filter((row) => row.highlight)
                    .map((row) => (
                      <ErrorRow key={row.fileName} row={row} />
                    ))}
                  {sortedHealthyRows
                    .filter((row) => row.highlight)
                    .map((row) => (
                      <HealthyRow key={row.fileName} row={row} />
                    ))}
                  {sortedErrorRows
                    .filter((row) => !row.highlight)
                    .map((row) => (
                      <ErrorRow key={row.fileName} row={row} />
                    ))}
                  {sortedHealthyRows
                    .filter((row) => !row.highlight)
                    .map((row) => (
                      <HealthyRow key={row.fileName} row={row} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
