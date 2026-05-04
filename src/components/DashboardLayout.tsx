import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Upload, Building2, Layers3, FileUp, ClipboardList, BarChart2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/oorc", label: "OORC", icon: ClipboardList },
  { path: "/pgs", label: "PGS", icon: BarChart2 },
  { path: "/uploads", label: "Uploads", icon: Upload, requireSuperAdmin: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isSuperAdmin, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center gap-6 justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm">
                DTI
              </div>
              <span className="font-heading font-bold text-lg hidden sm:block">
                Performance Tracker
              </span>
            </Link>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                if (item.requireSuperAdmin && !isSuperAdmin) return null;

                const isActive = location.pathname === item.path ||
                  (item.path.startsWith("/division/") && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div>
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLogin} className="text-primary border-primary/20 hover:bg-primary/5">
                <LogOut className="h-4 w-4 mr-2 rotate-180" />
                <span>Admin Login</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
