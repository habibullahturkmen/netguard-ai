import { NavLink, Outlet } from "react-router-dom";
import "../styles/dashboard.css";

const navItems = [
  { to: "/", label: "Overview", end: true },
  { to: "/traffic", label: "Traffic" },
  { to: "/analytics", label: "Analytics" },
  { to: "/alerts", label: "Alerts" },
  { to: "/logs", label: "Logs" },
];

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">🛡️</span>
          <div>
            <h1 className="app-title">NetGuard AI</h1>
            <p className="app-subtitle">Network intrusion detection dashboard</p>
          </div>
        </div>
        <nav className="app-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
