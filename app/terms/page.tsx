import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata = {
  title: "Terms of Use — Cognitive Empire",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#03050A] text-[#f1f5f9]">
      <CENav />

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <Link href="/legal" className="text-[#475569] text-xs hover:text-[#64748b] transition-colors mb-8 inline-block">
          ← Legal Hub
        </Link>

        <p className="text-[10px] text-[#C9A961] uppercase tracking-widest mb-4">Terms of Use</p>
        <h1 className="text-4xl font-thin text-[#f1f5f9] mb-4">Terms of Use</h1>
        <p className="text-[#475569] text-sm mb-12">Cognitive Empire Systems Ltd · Last updated: June 2026</p>

        <div className="prose-legal">

          <Section title="1. Operator">
            <p>These terms govern your use of the Cognitive Empire website and associated products, operated by <strong>Cognitive Empire Systems Ltd</strong> (company number 17272459), registered in England and Wales. Registered office: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom.</p>
          </Section>

          <Section title="2. Acceptance">
            <p>By accessing or using this site or any CE product, you agree to these terms. If you do not agree, you must not use our site or products.</p>
          </Section>

          <Section title="3. Intellectual Property">
            <p>All content on this site — including text, data, research, product design, system architecture, doctrine, and software — is the intellectual property of Cognitive Empire Systems Ltd or its licensors, unless otherwise stated. No content may be reproduced, distributed, modified, or used for commercial purposes without our express written permission.</p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>Use this site or any CE product for any unlawful purpose.</li>
              <li>Scrape, crawl, or systematically extract content from any CE property without express written permission.</li>
              <li>Attempt to gain unauthorized access to any system, account, or data.</li>
              <li>Reverse engineer, decompile, or disassemble any part of our software or products.</li>
              <li>Interfere with, disrupt, or attempt to compromise the integrity or performance of our systems.</li>
              <li>Impersonate Cognitive Empire Systems Ltd or any associated person.</li>
            </ul>
          </Section>

          <Section title="5. Content and Information">
            <p>Content on this site — including Signals, CE Research, product documentation, and other materials — is provided for informational and strategic purposes only. It does not constitute legal, financial, tax, medical, investment, or professional advice of any kind. No signed agreement or paid product terms supersede these general terms unless explicitly stated in a separate written instrument.</p>
          </Section>

          <Section title="6. No Guarantee of Outcomes">
            <p>CE does not guarantee any specific business, revenue, operational, or other outcome from the use of our site, products, intelligence materials, or systems. Results depend on factors outside our control, including the decisions and implementation choices of the user or their organization.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, Cognitive Empire Systems Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, this site or any CE product. Our total liability shall not exceed the amount paid by you, if any, for the product or service giving rise to the claim in the twelve months preceding the claim.</p>
          </Section>

          <Section title="8. Third-Party Links">
            <p>Our site may contain links to third-party websites. We are not responsible for the content or practices of those sites. Visiting third-party links is at your own risk.</p>
          </Section>

          <Section title="9. Changes to These Terms">
            <p>We may update these terms from time to time. Continued use of the site following any update constitutes acceptance of the revised terms. Material changes will be noted by updating the date above.</p>
          </Section>

          <Section title="10. Governing Law">
            <p>These terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </Section>

          <Section title="11. Contact">
            <p>Questions about these terms: <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a></p>
          </Section>

        </div>
      </div>

      <CEFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold text-[#f1f5f9] mb-4">{title}</h2>
      <div className="space-y-3 text-[#94a3b8] text-sm leading-relaxed [&_strong]:text-[#cbd5e1] [&_a]:text-[#C9A961] [&_a:hover]:text-[#D4B877] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
