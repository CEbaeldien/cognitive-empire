import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata = {
  title: "Refund Policy — Cognitive Empire",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#03050A] text-[#f1f5f9]">
      <CENav />

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <Link href="/legal" className="text-[#475569] text-xs hover:text-[#64748b] transition-colors mb-8 inline-block">
          ← Legal Hub
        </Link>

        <p className="text-[10px] text-[#C9A961] uppercase tracking-widest mb-4">Refund Policy</p>
        <h1 className="text-4xl font-thin text-[#f1f5f9] mb-4">Refund Policy</h1>
        <p className="text-[#475569] text-sm mb-12">Cognitive Empire Systems Ltd · Last updated: June 2026</p>

        <div className="prose-legal">

          <Section title="1. Operator">
            <p>This policy applies to purchases made through Cognitive Empire Systems Ltd (company number 17272459), registered in England and Wales.</p>
          </Section>

          <Section title="2. Payment Processing">
            <p>Purchases of CE digital products and subscriptions may be processed by <strong>Paddle</strong> as merchant of record. Where Paddle acts as merchant of record, refund handling is subject to Paddle's own policies and procedures, as well as applicable consumer rights legislation. Paddle's merchant of record terms govern the transaction between Paddle and the buyer.</p>
          </Section>

          <Section title="3. Subscriptions">
            <p>Cancelling a subscription stops future renewal charges from the next billing cycle. Cancellation does not automatically entitle you to a refund of charges already processed for the current or prior billing periods, unless required by applicable law or explicitly approved by us in writing.</p>
            <p>To cancel a subscription, use the customer portal provided at purchase or contact <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a>.</p>
          </Section>

          <Section title="4. One-Off Digital Products">
            <p>Purchases of one-off digital products — including downloads, reports, or access credentials — may be non-refundable once access has been provided, subject to applicable consumer rights law. We assess refund requests individually and consider factors including the nature of the product, whether access has been granted, and usage.</p>
          </Section>

          <Section title="5. Refund Eligibility">
            <p>Eligibility for a refund depends on:</p>
            <ul>
              <li>The product or subscription type.</li>
              <li>Whether access has been granted or the product delivered.</li>
              <li>Usage of the product or service.</li>
              <li>Applicable consumer rights law in your jurisdiction.</li>
              <li>Any explicit approval by Cognitive Empire Systems Ltd in writing.</li>
            </ul>
          </Section>

          <Section title="6. Statutory Rights">
            <p>Nothing in this policy limits or excludes your statutory rights under applicable consumer protection legislation, including the UK Consumer Rights Act 2015 or equivalent legislation in your jurisdiction where applicable.</p>
          </Section>

          <Section title="7. Contact">
            <p>To request a refund or discuss a purchase issue, contact <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a> with your order reference and a description of the issue. We aim to respond within five business days.</p>
          </Section>

          <Section title="8. Service Engagements">
            <p>CE Work engagements (audits, governance, and architecture services) are contracted and invoiced directly by Cognitive Empire Systems Ltd and are not sold through Paddle. Refunds and cancellation terms for engagements are governed by the individual engagement agreement.</p>
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
