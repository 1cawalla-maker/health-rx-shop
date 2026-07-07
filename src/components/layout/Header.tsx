import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPathForRole } from "@/lib/roleRoutes";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, loading } = useAuth();
  const dashboardPath = getDashboardPathForRole(userRole?.role);

  const renderAuthActions = (isMobile = false) => {
    if (loading || (user && !dashboardPath)) return null;

    if (user && dashboardPath) {
      return (
        <Button asChild className={isMobile ? "w-full rounded-2xl" : "rounded-2xl"}>
          <Link to={dashboardPath} onClick={() => isMobile && setIsMenuOpen(false)}>Dashboard</Link>
        </Button>
      );
    }

    return (
      <>
        <Button variant={isMobile ? "outline" : "ghost"} asChild className={isMobile ? "w-full rounded-2xl" : "rounded-2xl"}>
          <Link to="/auth" onClick={() => isMobile && setIsMenuOpen(false)}>Log in</Link>
        </Button>
        <Button asChild className={isMobile ? "w-full rounded-2xl" : "rounded-2xl shadow-glow"}>
          <Link to="/start-consult" onClick={() => isMobile && setIsMenuOpen(false)}>Start eligibility</Link>
        </Button>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/60 bg-white/85 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Pouch Care home">
          <img src="/brand/pouch-care-logo.png" alt="Pouch Care" className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/70 bg-white/80 p-1 shadow-sm">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href || (link.href !== "/" && location.pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">{renderAuthActions()}</div>

        <button className="md:hidden rounded-2xl p-2 text-foreground hover:bg-secondary" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-xl">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href || (link.href !== "/" && location.pathname.startsWith(link.href));
              return (
                <Link key={link.href} to={link.href} onClick={() => setIsMenuOpen(false)} className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{link.label}</Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">{renderAuthActions(true)}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
