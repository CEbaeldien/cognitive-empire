import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata = {
  title: "Privacy Policy — Cognitive Empire",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-[#f1f5f9]">
      <CENav />

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <Link href="/legal" className="text-[#475569] text-xs hover:text-[#64748b] transition-colors mb-8 inline-block">
          ← Legal Hub
        </Link>

        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-4">Privacy Policy</p>
        <h1 className="text-4xl font-thin text-[#f1f5f9] mb-4">Privacy Policy</h1>
        <p className="text-[#475569] text-sm mb-12">Cognitive Empire Systems Ltd · Last updated: June 2026</p>

        <div className="prose-legal">

          <Section title="1. Operator">
            <p>This policy applies to personal data processed by <strong>Cognitive Empire Systems Ltd</strong>, a private company limited by shares registered in England and Wales (company number 17272459). Registered office: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom.</p>
            <p>Contact: <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a></p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We may collect the following categories of personal data:</p>
            <ul>
              <li><strong>Identity and contact data:</strong> name, email address, organization name.</li>
              <li><strong>Communication data:</strong> the content of messages or inquiries you send us.</li>
              <li><strong>Technical usage data:</strong> IP address, browser type, pages visited, and similar technical information, where analytics are in use.</li>
              <li><strong>Payment and billing data:</strong> where purchases are made, payment processing is handled by Paddle as merchant of record. We do not store payment card details.</li>
            </ul>
          </Section>

          <Section title="3. Purposes of Processing">
            <p>We process personal data for the following purposes:</p>
            <ul>
              <li>Responding to inquiries and communications.</li>
              <li>Providing access to purchased products or services.</li>
              <li>Managing customer relationships and product access.</li>
              <li>Improving our site and understanding how it is used.</li>
              <li>Complying with legal obligations.</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis (UK/EEA Users)">
            <p>We process personal data on the basis of: your consent; performance of a contract or pre-contractual steps; compliance with a legal obligation; or our legitimate interests, where those interests are not overridden by your rights.</p>
          </Section>

          <Section title="5. Sharing of Data">
            <p>We share personal data only as necessary:</p>
            <ul>
              <li><strong>Hosting and infrastructure providers</strong> that process data on our behalf.</li>
              <li><strong>Payment processors:</strong> where payments are processed by Paddle as merchant of record, buyer and payment data is processed in accordance with Paddle's own privacy policy and applicable law.</li>
              <li><strong>Legal or regulatory authorities</strong> where required by law.</li>
            </ul>
            <p>We do not sell personal data.</p>
          </Section>

          <Section title="6. Retention">
            <p>We retain personal data only for as long as necessary to fulfil the purpose for which it was collected, or as required by applicable law. When data is no longer required, it is deleted or anonymised.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>Subject to applicable law, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to or request restriction of processing.</li>
              <li>Request portability of data you have provided, where technically feasible.</li>
              <li>Withdraw consent at any time, where processing is based on consent.</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a>.</p>
          </Section>

          <Section title="8. Contact and Complaints">
            <p>For privacy-related queries, contact <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a>. If you are dissatisfied with our handling of your data, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk.</p>
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
