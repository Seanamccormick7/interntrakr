import { Link, NavLink } from 'react-router-dom'

export function NavBar() {
  return (
    <header
      style={{
        borderBottom: '1px solid #333',
        background: 'transparent',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <Link to="/" style={{ fontWeight: 700, textDecoration: 'none' }}>
          InternTrackr
        </Link>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              textDecoration: 'none',
              fontWeight: isActive ? 700 : 500,
            })}
          >
            Home
          </NavLink>

          <NavLink
            to="/applications"
            style={({ isActive }) => ({
              textDecoration: 'none',
              fontWeight: isActive ? 700 : 500,
            })}
          >
            Applications
          </NavLink>
        </div>
      </nav>
    </header>
  )
}
