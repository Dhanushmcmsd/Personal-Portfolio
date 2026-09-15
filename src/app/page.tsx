import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProjectGallery from "@/components/ProjectGallery";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import SmoothScroll from "@/components/SmoothScroll";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <ProjectGallery />
        <About />
        <Experience />
        <Contact />
      </main>
    </>
  );
}
