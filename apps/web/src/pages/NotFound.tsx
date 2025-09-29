import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section>
      <h1>404 — Not Found</h1>
      <p>That page doesn't exist. Try the <Link to="/">Home</Link> page.</p>
    </section>
  )
}
