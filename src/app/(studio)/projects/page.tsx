import type { Metadata } from "next";
import ReelWall from "@/components/site/reel-wall";

export const metadata: Metadata = { title: "Projects | Star Production House" };

export default function Page() {
  return <ReelWall />;
}
