import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Teyra',
  description: 'Teyra Privacy Policy - How we collect, use, and protect your information when you use our productivity platform.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.app'}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Teyra's Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: October 24, 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p>
            Teyra ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website (https://teyra.app) and related services.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">We may collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account Information:</strong> Name, email, and authentication data when you sign in.</li>
              <li><strong>Payment Information:</strong> Processed securely by Stripe. We do not store your card details.</li>
              <li><strong>Calendar Data:</strong> If you connect Google Calendar, we access your events only to provide reminders and sync features.</li>
              <li><strong>Usage Data:</strong> Device, browser, and analytics information to improve performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use your data to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Operate and improve Teyra's features.</li>
              <li>Process payments and manage subscriptions.</li>
              <li>Provide personalized task reminders or insights.</li>
              <li>Ensure account security and prevent fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Data Sharing</h2>
            <p className="mb-3">We only share data with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Service providers (e.g., Stripe, Google) necessary to run Teyra.</li>
              <li>Legal authorities if required by law.</li>
            </ul>
            <p className="mt-3 font-semibold">We never sell personal data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Data Retention</h2>
            <p>
              We retain your information as long as your account is active. You can delete your data anytime by contacting us at <a href="mailto:greenteyra@gmail.com" className="text-violet-400 hover:text-violet-300 underline">greenteyra@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p>
              You may access, correct, or delete your data. EU/California users have additional rights under GDPR/CCPA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Security</h2>
            <p>
              We use encryption, secure servers, and verified third-party services (Stripe, Google) to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Contact</h2>
            <p>
              Questions? Contact us at <a href="mailto:greenteyra@gmail.com" className="text-violet-400 hover:text-violet-300 underline">greenteyra@gmail.com</a>.
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
