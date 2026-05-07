import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, FileCheck, Verified, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WalletConnection } from "./WalletConnection";
import type { Session } from "@supabase/supabase-js";

const Navigation = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
            <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="/tokenomics" className="text-muted-foreground hover:text-primary transition-colors">
              Tokenomics
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {session ? (
              <div className="flex items-center space-x-3">
                <WalletConnection />
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard'}>
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Dashboard</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin'}>
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Admin</span>
                </Button>
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">{session.user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button variant="hero" size="sm" onClick={() => window.location.href = '/auth'}>
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Get Started</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;