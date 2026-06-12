import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata = {
  title: "Cookie Policy — Cognitive Empire",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-[#f1f5f9]">
      <CENav />

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <Link href="/legal" className="text-[#475569] text-xs hover:text-[#64748b] transition-colors mb-8 inline-block">
          ← Legal Hub
        </Link>

        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-4">Cookie Policy</p>
        <h1 className="text-4xl font-thin text-[#f1f5f9] mb-4">Cookie Policy</h1>
        <p className="text-[#475569] text-sm mb-12">Cognitive Empire Systems Ltd · Last updated: June 2026</p>

        <div className="prose-legal">

          <Section title="1. What Are Cookies">
            <p>Cookies are small text files placed on your device when you visit a website. They are widely used to make websites function correctly and to provide usage information to site operators.</p>
          </Section>

          <Section title="2. Cookies We Use">
            <p><strong>Strictly necessary cookies:</strong> These are required for the site to function and cannot be switched off. They are typically set in response to actions you take, such as setting privacy preferences or logging in to a product.</p>
            <p><strong>Analytics cookies:</strong> Where analytics are in use, we or our analytics provider may set cookies to collect aggregated, anonymised data about how visitors use the site. We use this to improve our site and understand traffic patterns.</p>
            <p><strong>Payment and session cookies:</strong> Where you proceed to checkout, Paddle and related payment services may set cookies necessary to process the transaction and maintain your session.</p>
          </Section>

          <Section title="3. Consent">
            <p>Strictly necessary cookies do not require your consent. For non-essential cookies, including analytics, we will seek your consent where required by applicable law. You may withdraw consent at any time by adjusting your browser settings or contacting us.</p>
          </Section>

          <Section title="4. Managing Cookies">
            <p>You can control and delete cookies through your browser settings. Disabling certain cookies may affect the functionality of this site or CE products. Instructions for common browsers are available at the browser provider's support pages.</p>
          </Section>

          <Section title="5. Cookie List">
            <p>A detailed cookie list will be updated as analytics and payment tooling are finalized. For current information about specific cookies in use, contact <a href="mailto:founder@cognitiveempire.com">founder@cognitiveempire.com</a>.</p>
          </Section>

          <Section title="6. Changes">
            <p>We may update this policy as our use of cookies changes. The date above reflects the most recent revision.</p>
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
