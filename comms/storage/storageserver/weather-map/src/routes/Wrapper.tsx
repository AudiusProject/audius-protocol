import { Link, Outlet } from 'react-router-dom'

import Search from '../components/search/Search'

export default function Wrapper() {
  return (
    <div className="min-h-full px-1">
      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="bg-gradient-to-r from-purple-400 to-purple-800 bg-clip-text text-center text-5xl font-extrabold leading-tight tracking-tight text-transparent lg:text-7xl">
              <Link to="/">Weather Map</Link>
            </h1>
          </div>
        </header>

        <br />

        <main className="place mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Search />

          <br />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
