import Features from "@/components/landing/Features/Features";
import Hero from "@/components/landing/Hero/Hero";
import Navbar from "@/components/landing/Navbar/Navbar";
import Solutions from "@/components/landing/Solutions/Solutions";

const page = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Solutions />
    </>
  );
};

export default page;
