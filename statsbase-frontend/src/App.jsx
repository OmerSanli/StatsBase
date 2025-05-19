import { useEffect, useState } from 'react'

function App() {
  const [response, setResponse] = useState('Loading...')

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/test')
      .then(res => res.json())
      .then(data => setResponse(data.message))
      .catch(err => setResponse('Error: ' + err.message))
  }, [])

  return (
    <div>
      <h1>StatsBase Frontend</h1>
      <p>Backend says: {response}</p>
    </div>
  )
}

export default App
