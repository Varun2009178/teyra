import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Teyra',
  description: 'Teyra Terms of Service - The terms and conditions for using our productivity platform.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.app'}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Teyra Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: January 24, 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p>
            Welcome to Teyra. By using our site or app, you agree to these Terms of Service.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Use of Service</h2>
            <p>
              Teyra provides productivity and motivation tools. You agree not to misuse the platform or attempt unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and any activity under it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Payments and Subscriptions</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payments are processed by Stripe.</li>
              <li>When you subscribe to Teyra Premium, you are billed immediately for one month of access.</li>
              <li>If you cancel, your premium benefits remain active until the end of your billing cycle; you will not be charged again.</li>
              <li>We do not offer partial refunds for unused time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Intellectual Property</h2>
            <p>
              All content, code, and branding are owned by Teyra. You may not copy or resell them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Disclaimer</h2>
            <p>
              Teyra is provided "as is." We make no warranties about uptime or results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Teyra is not liable for indirect, incidental, or consequential damages arising from use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Changes</h2>
            <p>
              We may update these Terms periodically. Continued use means you accept any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">8. Contact</h2>
            <p>
              For questions, contact <a href="mailto:greenteyra@gmail.com" className="text-violet-400 hover:text-violet-300 underline">greenteyra@gmail.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <a
            href="/"
            className="text-violet-400 hover:text-violet-300 font-medium"
          >
            ← Back to Teyra
          </a>
        </div>
      </div>
    </div>
  );
}
