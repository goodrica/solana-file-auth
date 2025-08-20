import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, FileCheck, Link } from "lucide-react";
import heroImage from "@/assets/hero-blockchain.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage}
          alt="Blockchain security and file authentication"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-surface"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Blockchain-Powered File Authentication</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Verify Photo Authenticity with{" "}
            <span className="gradient-text">Unbreakable</span>{" "}
            Blockchain Proof
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            FilmAuth provides cryptographic proof of your photo's authenticity using Solana blockchain technology. 
            Fight deepfakes with secure, immutable, and verifiable digital proof.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button variant="hero" size="lg" className="text-lg px-8">
              <FileCheck className="h-5 w-5" />
              Authenticate File
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              <Shield className="h-5 w-5" />
              Verify Authenticity
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 glow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Cryptographic Security</h3>
              <p className="text-muted-foreground">SHA-256 hashing ensures maximum file integrity</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-4 glow">
                <Link className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Immutable Records</h3>
              <p className="text-muted-foreground">Solana blockchain provides permanent verification</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 glow">
                <FileCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">Files never leave your device during verification</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;