import { Card, CardContent } from "@/components/ui/card";
import { Upload, Hash, Link, Shield } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your File",
    description: "Select any file from your device. Your file never leaves your computer for maximum privacy and security.",
    color: "text-primary"
  },
  {
    icon: Hash,
    title: "Generate Cryptographic Hash",
    description: "FilmAuth calculates a unique SHA-256 hash of your file - a digital fingerprint that's impossible to forge.",
    color: "text-secondary"
  },
  {
    icon: Link,
    title: "Record on Blockchain",
    description: "The hash is permanently recorded on the Solana blockchain, creating an immutable timestamp and proof of authenticity.",
    color: "text-accent"
  },
  {
    icon: Shield,
    title: "Verify Anytime",
    description: "Anyone can verify your file's authenticity by comparing its hash against the blockchain record - proof that lasts forever.",
    color: "text-primary"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How FilmAuth Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our blockchain-based authentication process ensures your files have verifiable, 
              tamper-proof certificates of authenticity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="h-full shadow-card bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="relative mb-6">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto glow`}>
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3">
                      {step.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Connection Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-0.5 bg-gradient-primary opacity-60"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-l-primary border-t-transparent border-b-transparent"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <h4 className="font-semibold mb-2">Immutable Proof</h4>
              <p className="text-sm text-muted-foreground">
                Once recorded, blockchain entries cannot be altered or deleted
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Hash className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Cryptographic Security</h4>
              <p className="text-sm text-muted-foreground">
                SHA-256 hashing provides military-grade file integrity verification
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold mb-2">Privacy First</h4>
              <p className="text-sm text-muted-foreground">
                Files are processed locally - your data never leaves your device
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;