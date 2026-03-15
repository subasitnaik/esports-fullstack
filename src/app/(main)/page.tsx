import {
  HeroSection,
  GamesSection,
  AboutSection,
  StatsSection,
  GetAppSection,
  FAQSection,
} from "@/components/sections";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <HeroSection />
      <GamesSection />
      <AboutSection />
      <StatsSection />
      <GetAppSection />
      <FAQSection />
    </main>
  );
}
