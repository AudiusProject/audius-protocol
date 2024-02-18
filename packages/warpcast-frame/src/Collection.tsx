import { useParams } from 'react-router-dom'

const Collection = () => {
  const { collectionName } = useParams()
  return <div>collection page for collection '{collectionName}'</div>
}

export default Collection
