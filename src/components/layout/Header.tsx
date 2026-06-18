import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPathForRole } from "@/lib/roleRoutes";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/guides", label: "Guides" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, loading } = useAuth();
  const dashboardPath = getDashboardPathForRole(userRole?.role);

  const renderAuthActions = (isMobile = false) => {
    if (loading || (user && !dashboardPath)) {
      return null;
    }

    if (user && dashboardPath) {
      return (
        <Button asChild className={isMobile ? "w-full" : undefined}>
          <Link to={dashboardPath} onClick={() => isMobile && setIsMenuOpen(false)}>
            Dashboard
          </Link>
        </Button>
      );
    }

    return (
      <>
        <Button variant={isMobile ? "outline" : "ghost"} asChild className={isMobile ? "w-full" : undefined}>
          <Link to="/auth" onClick={() => isMobile && setIsMenuOpen(false)}>Log in</Link>
        </Button>
        <Button asChild className={isMobile ? "w-full" : undefined}>
          <Link to="/start-consult" onClick={() => isMobile && setIsMenuOpen(false)}>Start consult</Link>
        </Button>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>PouchCare</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {renderAuthActions()}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              {renderAuthActions(true)}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
