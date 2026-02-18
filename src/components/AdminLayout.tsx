import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Scale } from "lucide-react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/disputes", label: "Disputes", icon: Scale },
];

export function AdminLayout() {
  const location = useLocation();
  return (
    <main className="container py-6">
      <div className="mb-6 flex items-center gap-4 border-b pb-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <nav className="flex gap-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                (to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </main>
  );
}
