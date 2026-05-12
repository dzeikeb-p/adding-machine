import { NavLink, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ApiDocs } from './components/ApiDocs.js';
import { About } from './components/About.js';
import { Machine } from './components/Machine.js';

function Nav() {
  return (
    <header style={{ borderBottom: '1px solid var(--color-ink)' }}>
      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'baseline',
          gap: '2rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          Gysin's Adding Machine
        </span>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Machine
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            About
          </NavLink>
          <NavLink
            to="/api-docs"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            API
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Machine />} />
            <Route path="/about" element={<About />} />
            <Route path="/api-docs" element={<ApiDocs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
