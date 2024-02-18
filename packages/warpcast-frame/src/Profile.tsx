import { useParams } from 'react-router-dom'

const Profile = () => {
  const { handle } = useParams()
  return <div>profile page for '{handle}'</div>
}

export default Profile
