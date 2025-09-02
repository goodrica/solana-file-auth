import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import AirdropPromo from "@/components/AirdropPromo";
import FileAuthentication from "@/components/FileAuthentication";
import FileVerification from "@/components/FileVerification";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <AirdropPromo />
      <FileAuthentication />
      <FileVerification />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
