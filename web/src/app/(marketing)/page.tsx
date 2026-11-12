import { Benefits } from "@/components/landing/benefits";
import { BuiltWith } from "@/components/landing/built-with";
import { Hero } from "@/components/landing/hero";
import { Layers } from "@/components/landing/layers";
import { LiveStalls } from "@/components/landing/live-stalls";
import { Questions } from "@/components/landing/questions";
import { Showcase } from "@/components/landing/showcase";

export default function Home() {
  return (
    <main>
      <Hero />
      <Showcase />
      <Benefits />
      <BuiltWith />
      <Layers />
      <LiveStalls />
      <Questions />
    </main>
  );
}
