import type { Metadata } from "next";
import ContactSection from "@/components/site/contact-section";
import ServicesSection from "@/components/site/services-section";

export const metadata: Metadata = { title: "Services | Star Production House" };

export default function Page() {
  return <><ServicesSection /><div id="enquiry"><ContactSection /></div></>;
}
