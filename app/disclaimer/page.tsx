import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata = {
  title: "Disclaimer — Cognitive Empire",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-[#f1f5f9]">
      <CENav />

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <Link href="/legal" className="text-[#475569] text-xs hover:text-[#64748b] transition-colors mb-8 inline-block">
          ← Legal Hub
        </Link>

        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-4">Disclaimer</p>
        <h1 className="text-4xl font-thin text-[#f1f5f9] mb-4">Disclaimer</h1>
        <p className="text-[#475569] text-sm mb-12">Cognitive Empire Systems Ltd · Last updated: June 2026</p>

        <div className="prose-legal">

          <Section title="1. Nature of Content">
            <p>Content published by Cognitive Empire — including Signals, CE Research, Drift product outputs, Work system documentation, FoundryLabs materials, and any other CE content — is provided for informational and strategic purposes only.</p>
            <p>Nothing on this site or within any CE product constitutes legal, financial, tax, medical, investment, regulatory, or professional advice of any kind. CE content does not create a professional advisory relationship between Cognitive Empire Systems Ltd and any user.</p>
          </Section>

          <Section title="2. AI and System Outputs">
            <p>CE products may incorporate AI-generated or algorithmically produced outputs. Such outputs are produced as decision support tools and require human review and judgment before any reliance, implementation, or action is taken. CE does not warrant the accuracy, completeness, or suitability of AI-generated outputs for any specific purpose.</p>
          </Section>

          <Section title="3. User Responsibility">
            <p>Users remain solely responsible for:</p>
            <ul>
              <li>All decisions made on the basis of CE content, products, or outputs.</li>
              <li>The implementation of any system, process, or workflow informed by CE materials.</li>
              <li>Compliance with applicable laws, regulations, and professional standards in their jurisdiction and industry.</li>
              <li>The outcomes, results, or consequences of their operational choices.</li>
            </ul>
          </Section>

          <Section title="4. No Guarantee of Results">
            <p>Cognitive Empire Systems Ltd makes no warranty, express or implied, that use of our site, products, or content will result in any specific business, financial, operational, or other outcome. Past performance or case references, if any, do not guarantee future results.</p>
          </Section>

          <Section title="5. External Links and Third-Party Content">
            <p>CE materials may reference or link to third-party sources. We do not control third-party content and make no representation as to its accuracy or completeness. Links to external sites are provided for reference only and are governed by the terms of those third parties.</p>
          </Section>

          <Section title="6. Contact">
            <p>Questions about this disclaimer: <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a></p>
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
      <div className="space-y-3 text-[#94a3b8] text-sm leading-relaxed [&_strong]:text-[#cbd5e1] [&_a]:text-blue-400 [&_a:hover]:text-blue-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
