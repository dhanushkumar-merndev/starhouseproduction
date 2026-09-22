import type { Metadata } from "next";
import ProjectsSection from "@/components/site/projects-section";

export const metadata: Metadata = { title: "Projects | Star Production House" };

export default function Page() {
  return <ProjectsSection />;
}
