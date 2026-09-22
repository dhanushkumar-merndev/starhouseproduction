import type { Metadata } from "next";
import AboutSection from "@/components/site/about-section";

export const metadata: Metadata = { title: "About Us | Star Production House" };

export default function Page() {
  return <AboutSection />;
}
