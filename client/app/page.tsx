import Benefits from "@/components/landing/Benefits/Benefits";
import Features from "@/components/landing/Features/Features";
import FinalCTA from "@/components/landing/FinalCTA/FinalCTA";
import Footer from "@/components/landing/Footer/Footer";
import Hero from "@/components/landing/Hero/Hero";
import Navbar from "@/components/landing/Navbar/Navbar";
import Pricing from "@/components/landing/Pricing/Pricing";
import Solutions from "@/components/landing/Solutions/Solutions";

const page = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Solutions />
      <Benefits />
      <Pricing />
      <FinalCTA />
      <Footer />
    </>
  );
};

export default page;
