import './App.css'
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import NodeView from './components/NodeView';
import BucketView from './components/BucketView';

const queryClient = new QueryClient();
const baseURL = '/storage/weather'

export default function App() {
  const router = createBrowserRouter([
    {
      path: `${baseURL}/`,
      element: <NodeView />,
      children: [
        
      ]
    },
    {
      path: `${baseURL}/bucket/:bucket`,
      element: <BucketView />,
    },
    // {
    //   path: `${baseURL}/job/:job`,
    //   element: <JobView />,
    // }
  ]);
  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </div>
  )
}
