import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { Solutions } from "./Solutions";
import { Benefits } from "./Benefits";
import { Pricing } from "./Pricing";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";

export const LandingPage = () => {
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

export default LandingPage;
