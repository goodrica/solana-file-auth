import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card/50 backdrop-blur-sm border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold gradient-text">FilmAuth</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Blockchain-powered file authentication platform providing immutable proof of 
              authenticity for your digital assets.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Powered by Solana Blockchain</p>
              <p>Built with privacy and security in mind</p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#authenticate" className="hover:text-primary transition-colors">Authenticate Files</a></li>
              <li><a href="#verify" className="hover:text-primary transition-colors">Verify Files</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © 2024 FilmAuth. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm text-muted-foreground mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;