import { Button } from "@/components/ui/button";
import { Shield, FileCheck, Verified } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">FilmAuth</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#authenticate" className="text-muted-foreground hover:text-primary transition-colors">
              Authenticate
            </a>
            <a href="#verify" className="text-muted-foreground hover:text-primary transition-colors">
              Verify
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
              How It Works
            </a>
          </div>

          {/* CTA Button */}
          <Button variant="hero" size="sm">
            <FileCheck className="h-4 w-4" />
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;