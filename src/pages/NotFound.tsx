import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Home, Mail } from "lucide-react";

export default function NotFound() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-32 gradient-section min-h-[60vh] flex items-center">
        <div className="container">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="text-8xl font-display font-bold text-primary/20">404</div>
            <h1 className="font-display text-3xl font-bold text-foreground">Page Not Found</h1>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild>
                <Link to="/"><Home className="h-4 w-4 mr-2" />Back to Home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact"><Mail className="h-4 w-4 mr-2" />Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
