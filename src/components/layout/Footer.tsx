import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const footerLinks = {
  pathway: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/start-consult", label: "Start eligibility" },
    { href: "/faq", label: "FAQ" },
    { href: "/guides", label: "Guides" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/disclaimer", label: "Medical Disclaimer" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--pc-bg-soft-blue))_100%)]">
      <div className="container py-12 md:py-16">
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/20"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></div>
                <span className="uppercase tracking-wide">PouchCare</span>
              </Link>
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                An Australian eligibility-first online pathway built around clinical review where relevant, prescription requirements, and prescription-gated ordering only where requirements are met.
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground mb-4">Pathway</h4>
              <ul className="space-y-3">
                {footerLinks.pathway.map((link) => (
                  <li key={link.href}><Link to={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}><Link to={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}><Link to={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 md:flex md:items-start md:justify-between md:gap-8">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PouchCare. All rights reserved.</p>
            <p className="mt-4 max-w-2xl text-xs leading-6 text-muted-foreground md:mt-0 md:text-right">
              General information only. Not medical or legal advice. PouchCare does not guarantee that a prescription will be issued or that any product, brand, strength, flavour, supply, importation outcome, customs outcome, or delivery timeframe will be available. Ordering can only unlock where prescription entitlement requirements are met. This service is not for emergencies.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
