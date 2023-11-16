import { useState } from 'react'

const people = [
  { name: 'Lindsay Walton', title: 'Front-end Developer', email: 'lindsay.walton@example.com', role: 'Member' }
]

const NetworkOverview = () => {
  return (
    <>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="tableHeaderCellFirst">
                      Health
                    </th>
                    <th scope="col" className="tableHeaderCell">
                      Version
                    </th>
                    <th scope="col" className="tableHeaderCell">
                      Uptime
                    </th>
                    <th scope="col" className="tableHeaderCell">
                      Host
                    </th>
                    <th scope="col" className="tableHeaderCell">
                      Bond $AUDIO
                    </th>
                    <th scope="col" className="tableHeaderCell">
                      Reward (24h)
                    </th>
                    <th scope="col" className="tableHeaderCell">
                      Requests (24h)
                    </th>
                    <th scope="col" className="tableHeaderCell">
                      Operator
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {people.map((person) => (
                    <tr key={person.email}>
                      <td className="tableCellFirst">
                        {person.name}
                      </td>
                      <td className="tableCell">{person.title}</td>
                      <td className="tableCell">{person.email}</td>
                      <td className="tableCell">{person.role}</td>
                      <td className="tableCell">{person.role}</td>
                      <td className="tableCell">{person.role}</td>
                      <td className="tableCell">{person.role}</td>
                      <td className="tableCell">{person.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NetworkOverview
