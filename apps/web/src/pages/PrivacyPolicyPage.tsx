import React from "react";
import InfoPageLayout from "../components/InfoPageLayout";
import { useTranslation } from "react-i18next";

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation("common");

  return (
    <InfoPageLayout
      title={t("privacyPolicy")}
      subtitle={t("privacyPolicySubtitle")}
    >
      {/* Introduction */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            1
          </span>
          Introduction
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            Welcome to our Family Portal ("we," "our," or "the website"). This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our family website and use our
            services. This website is designed as a private family portal for
            sharing memories, documents, and staying connected with family
            members.
          </p>
          <p className="text-text-base leading-relaxed">
            By accessing or using our website, you agree to the collection and
            use of information in accordance with this Privacy Policy. If you do
            not agree with our policies and practices, please do not use our
            website.
          </p>
        </div>
      </section>

      {/* Information We Collect */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            2
          </span>
          Information We Collect
        </h2>

        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-secondary mb-3">
              Personal Information
            </h3>
            <p className="text-text-base leading-relaxed mb-3">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong className="text-text-base">Account Information:</strong>{" "}
                Full name, username, email address, and password (encrypted)
              </li>
              <li>
                <strong className="text-text-base">Profile Information:</strong>{" "}
                Date of birth, gender, mobile number (optional)
              </li>
              <li>
                <strong className="text-text-base">Family Content:</strong>{" "}
                Photos, documents, stories, and other content you choose to
                share
              </li>
              <li>
                <strong className="text-text-base">Communication Data:</strong>{" "}
                Messages, comments, and interactions within the family portal
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-secondary mb-3">
              Automatically Collected Information
            </h3>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong className="text-text-base">Usage Data:</strong> Pages
                visited, time spent, features used, and navigation patterns
              </li>
              <li>
                <strong className="text-text-base">Device Information:</strong>{" "}
                Browser type, operating system, IP address, and device
                identifiers
              </li>
              <li>
                <strong className="text-text-base">Log Data:</strong> Server
                logs, error reports, and performance metrics for security and
                improvement
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Use Information */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            3
          </span>
          How We Use Your Information
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            We use the information we collect for the following purposes:
          </p>
          <ul className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Account Management",
                desc: "Create and maintain your family portal account",
              },
              {
                title: "Family Communication",
                desc: "Enable sharing of photos, documents, and messages",
              },
              {
                title: "Security",
                desc: "Protect against unauthorized access and maintain safety",
              },
              {
                title: "Service Improvement",
                desc: "Analyze usage patterns to enhance user experience",
              },
              {
                title: "Technical Support",
                desc: "Provide customer support and troubleshoot issues",
              },
              {
                title: "Legal Compliance",
                desc: "Comply with applicable laws and regulations",
              },
            ].map((item, index) => (
              <li
                key={index}
                className="flex flex-col p-4 bg-background rounded-xl border border-border hover:border-secondary/50 transition-colors"
              >
                <strong className="text-primary mb-1">{item.title}</strong>
                <span className="text-text-muted text-sm">{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Information Sharing */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            4
          </span>
          Information Sharing and Disclosure
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            <strong className="text-secondary">
              We do not sell, rent, or trade your personal information.
            </strong>{" "}
            We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
            <li>
              <strong className="text-text-base">Within Family:</strong> Content
              you share is visible to other authenticated family members
            </li>
            <li>
              <strong className="text-text-base">Service Providers:</strong>{" "}
              Trusted third-party services that help us operate the website
              (hosting, email services)
            </li>
            <li>
              <strong className="text-text-base">Legal Requirements:</strong>{" "}
              When required by law, court order, or to protect rights and safety
            </li>
            <li>
              <strong className="text-text-base">Business Transfer:</strong> In
              the event of a merger, acquisition, or sale of assets (with
              notice)
            </li>
            <li>
              <strong className="text-text-base">Consent:</strong> When you
              explicitly consent to sharing with specific third parties
            </li>
          </ul>
        </div>
      </section>

      {/* Data Security */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            5
          </span>
          Data Security
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            We implement comprehensive security measures to protect your
            information:
          </p>
          <ul className="grid md:grid-cols-2 gap-3 mb-6">
            {[
              "Encryption (HTTPS/TLS)",
              "Secure Password Hashing",
              "Strict Access Controls",
              "Regular Security Updates",
              "Continuous Monitoring",
              "Secure Data Backups",
            ].map((item, i) => (
              <li key={i} className="flex items-center text-text-muted">
                <svg
                  className="w-5 h-5 text-success mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start">
            <svg
              className="w-6 h-6 text-warning mr-3 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-text-base text-sm">
              <strong>Important:</strong> While we implement robust security
              measures, no method of transmission over the internet is 100%
              secure. We cannot guarantee absolute security but are committed to
              protecting your information using industry best practices.
            </p>
          </div>
        </div>
      </section>

      {/* Cookies and Tracking */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            6
          </span>
          Cookies and Tracking Technologies
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            We use cookies and similar technologies to enhance your experience:
          </p>
          <ul className="list-disc list-inside text-text-muted space-y-2 ml-2 mb-4">
            <li>
              <strong className="text-text-base">Essential Cookies:</strong>{" "}
              Required for authentication, security, and basic portal
              functionality
            </li>
            <li>
              <strong className="text-text-base">Preference Cookies:</strong>{" "}
              Remember your theme settings, language preferences, and layout
              choices
            </li>
            <li>
              <strong className="text-text-base">Analytics Cookies:</strong>{" "}
              Help us understand how you use the website to improve performance
            </li>
            <li>
              <strong className="text-text-base">Session Storage:</strong>{" "}
              Temporary storage for your current session and form data
            </li>
          </ul>
          <p className="text-text-muted text-sm italic">
            You can control cookies through your browser settings, but disabling
            essential cookies may affect website functionality.
          </p>
        </div>
      </section>

      {/* Data Retention */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            7
          </span>
          Data Retention
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            We retain your information for as long as necessary to provide our
            services:
          </p>
          <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
            <li>
              <strong className="text-text-base">Account Data:</strong> Retained
              while your account is active and for 1 year after deactivation
            </li>
            <li>
              <strong className="text-text-base">Family Content:</strong>{" "}
              Preserved as long as family members wish to maintain shared
              memories
            </li>
            <li>
              <strong className="text-text-base">Log Data:</strong>{" "}
              Automatically deleted after 90 days unless required for security
              investigations
            </li>
            <li>
              <strong className="text-text-base">Communication Records:</strong>{" "}
              Retained for 2 years for family reference and dispute resolution
            </li>
          </ul>
        </div>
      </section>

      {/* Your Rights */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            8
          </span>
          Your Privacy Rights
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            You have the following rights regarding your personal information:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {[
              "Access your data",
              "Correct inaccuracies",
              "Request deletion",
              "Data portability",
              "Restrict processing",
              "Object to processing",
            ].map((right, i) => (
              <div
                key={i}
                className="flex items-center p-3 bg-background rounded-lg border border-border"
              >
                <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                <span className="text-text-base font-medium">{right}</span>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-sm">
            To exercise these rights, please contact us using the information
            provided below.
          </p>
        </div>
      </section>

      {/* Children's Privacy */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            9
          </span>
          Children's Privacy
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            Our family portal may include content related to children within our
            family. We are committed to protecting children's privacy:
          </p>
          <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
            <li>
              We do not knowingly collect personal information from children
              under 13 without parental consent
            </li>
            <li>
              All children's content is shared privately within the family
              circle only
            </li>
            <li>
              Parents/guardians have full control over their children's
              information and content
            </li>
            <li>
              We comply with COPPA (Children's Online Privacy Protection Act)
              requirements
            </li>
          </ul>
        </div>
      </section>

      {/* Third-Party Services */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            10
          </span>
          Third-Party Services
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            Our website may integrate with third-party services to enhance
            functionality:
          </p>
          <ul className="list-disc list-inside text-text-muted space-y-2 ml-2 mb-4">
            <li>
              <strong className="text-text-base">Email Services:</strong> For
              account verification and password reset emails
            </li>
            <li>
              <strong className="text-text-base">Cloud Storage:</strong> Secure
              storage of family photos and documents
            </li>
            <li>
              <strong className="text-text-base">Analytics:</strong> Anonymous
              usage statistics to improve website performance
            </li>
            <li>
              <strong className="text-text-base">CDN Services:</strong> Content
              delivery networks for faster loading times
            </li>
          </ul>
          <p className="text-text-muted text-sm">
            These services have their own privacy policies. We encourage you to
            review them when using integrated features.
          </p>
        </div>
      </section>

      {/* International Users */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            11
          </span>
          International Data Transfers
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            If you are accessing our website from outside your country of
            residence, please note:
          </p>
          <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
            <li>
              Your information may be transferred to and processed in countries
              with different privacy laws
            </li>
            <li>
              We ensure appropriate safeguards are in place for international
              data transfers
            </li>
            <li>
              We comply with applicable data protection regulations (GDPR, CCPA,
              etc.)
            </li>
            <li>
              Your consent to this Privacy Policy includes consent to such
              transfers
            </li>
          </ul>
        </div>
      </section>

      {/* Changes to Policy */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            12
          </span>
          Changes to This Privacy Policy
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-4">
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or legal requirements:
          </p>
          <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
            <li>
              We will post the updated policy on this page with a new "Last
              updated" date
            </li>
            <li>
              For significant changes, we will notify you via email or website
              notification
            </li>
            <li>
              Your continued use of the website after changes constitutes
              acceptance
            </li>
            <li>We encourage you to review this policy periodically</li>
          </ul>
        </div>
      </section>

      {/* Contact Information */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg shadow-primary/20">
            13
          </span>
          Contact Us
        </h2>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <p className="text-text-base leading-relaxed mb-6">
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4 shadow-sm">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Email</div>
                  <strong className="text-primary">
                    REDACTED_MONGO_PASSWORD@gmail.com
                  </strong>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4 shadow-sm">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Response Time</div>
                  <strong className="text-text-base">
                    We aim to respond within 48 hours
                  </strong>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4 shadow-sm">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Subject Line</div>
                  <strong className="text-text-base">
                    Please include "Privacy Policy" in your email subject
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
};

export default PrivacyPolicyPage;
