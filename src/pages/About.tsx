import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import GetInvolvedForm from "@/components/GetInvolvedForm";
import { Shield, Lock, Globe, DollarSign, Eye } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Protecting Truth in the Digital Age
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              In a world where deepfakes and synthetic content threaten trust, 
              FilmAuth provides immutable proof of authenticity for your digital media.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Mission</h2>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              FilmAuth was created to address one of the most pressing challenges of our time: 
              the erosion of trust in digital media due to increasingly sophisticated deepfakes 
              and synthetic content.
            </p>
            <p>
              We believe that photographers, journalists, and content creators deserve tools 
              that can prove the authenticity and timing of their work in a way that cannot 
              be manipulated or controlled by any single entity.
            </p>
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12 text-center">How We're Different</h2>
          
          <div className="mb-8">
            <p className="text-lg text-muted-foreground mb-8">
              Unlike traditional timestamping services that rely on centralized servers, 
              FilmAuth uses blockchain technology to create permanent, immutable records 
              that anyone can verify independently.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Privacy-First</h3>
                <p className="text-muted-foreground">
                  Your files never leave your browser. We only store cryptographic hashes, 
                  ensuring your content remains completely private.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Decentralized</h3>
                <p className="text-muted-foreground">
                  No single point of failure or control. Records are stored on the blockchain, 
                  making them permanently accessible and tamper-proof.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Affordable</h3>
                <p className="text-muted-foreground">
                  Uses Solana's low-cost blockchain infrastructure, making authentication 
                  accessible to creators of all sizes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Transparent</h3>
                <p className="text-muted-foreground">
                  All verification is publicly auditable. Anyone can independently verify 
                  the authenticity of timestamped content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why FOT Matters */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Why FOT Matters</h2>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              Why not invest in a crypto token you actually understand—one that serves a real purpose in the world? 
              FOT isn't just another meme coin. It's a token you can explain to anyone.
            </p>
            <p>
              Think of each FOT as a digital film negative. Once you use it, it's burned—just like an old roll of film—never 
              to be reused. That action authenticates your digital photo at a moment in time, so any edits later can be proven fake.
            </p>
            <p>
              Authenticating photos shouldn't be expensive, and neither should the token that powers it. We're building a 
              community of people solving real problems, not chasing hype.
            </p>
            <p>
              We're also transparent. Is FOT perfect today? No. But with your help, it can be. We need developers, creators, 
              and believers to make it stronger—whether it's connecting FOT to major phone apps or pushing forward new tools 
              for digital authenticity.
            </p>
            <p className="text-xl font-semibold text-foreground">
              This is a movement for real change, and we're inviting you to be part of it.
            </p>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Get Involved in Development</h2>
          <div className="bg-card rounded-lg p-8 shadow-sm border">
            <p className="text-muted-foreground mb-8 text-center">
              Interested in contributing to FilmAuth? We're always looking for passionate developers, 
              designers, and blockchain enthusiasts to help build the future of digital media authentication.
            </p>
            <GetInvolvedForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;