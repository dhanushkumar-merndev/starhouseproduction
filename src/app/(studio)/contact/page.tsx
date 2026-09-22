import type { Metadata } from "next";
import ContactIntro from "@/components/site/contact-intro";
import ContactSection from "@/components/site/contact-section";

export const metadata: Metadata = {
  title: "Contact | Star Production House",
  description: "Start a project with Star Production House — films, commercials, reels, brand stories and post-production.",
};

export default function Page() {
  return <><ContactIntro /><div id="enquiry"><ContactSection /></div></>;
}
