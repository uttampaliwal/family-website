import React from "react";
import InfoPageLayout from "../components/InfoPageLayout";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Privacy Policy"
      subtitle="Your privacy matters to us. Learn how we protect and handle your information."
    >
      {/* Introduction */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            1
          </span>
          Introduction
        </h2>
        <p className="text-base leading-relaxed mb-4">
          Welcome to our Family Portal ("we," "our," or "the website"). This
          Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you visit our family website and use our
          services. This website is designed as a private family portal for
          sharing memories, documents, and staying connected with family
          members.
        </p>
        <p className="text-base leading-relaxed">
          By accessing or using our website, you agree to the collection and use
          of information in accordance with this Privacy Policy. If you do not
          agree with our policies and practices, please do not use our website.
        </p>
      </section>

      {/* Information We Collect */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            2
          </span>
          Information We Collect
        </h2>

        <h3 className="text-xl font-medium text-base mb-3 ml-11">
          Personal Information
        </h3>
        <p className="text-base leading-relaxed mb-4 ml-11">
          When you register for an account, we collect:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-6 ml-11">
          <li>
            <strong>Account Information:</strong> Full name, username, email
            address, and password (encrypted)
          </li>
          <li>
            <strong>Profile Information:</strong> Date of birth, gender, mobile
            number (optional)
          </li>
          <li>
            <strong>Family Content:</strong> Photos, documents, stories, and
            other content you choose to share
          </li>
          <li>
            <strong>Communication Data:</strong> Messages, comments, and
            interactions within the family portal
          </li>
        </ul>

        <h3 className="text-xl font-medium text-base mb-3 ml-11">
          Automatically Collected Information
        </h3>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Usage Data:</strong> Pages visited, time spent, features
            used, and navigation patterns
          </li>
          <li>
            <strong>Device Information:</strong> Browser type, operating system,
            IP address, and device identifiers
          </li>
          <li>
            <strong>Log Data:</strong> Server logs, error reports, and
            performance metrics for security and improvement
          </li>
        </ul>
      </section>

      {/* How We Use Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            3
          </span>
          How We Use Your Information
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          We use the information we collect for the following purposes:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Account Management:</strong> Create and maintain your family
            portal account
          </li>
          <li>
            <strong>Family Communication:</strong> Enable sharing of photos,
            documents, and messages within the family
          </li>
          <li>
            <strong>Security:</strong> Protect against unauthorized access and
            maintain platform security
          </li>
          <li>
            <strong>Service Improvement:</strong> Analyze usage patterns to
            enhance user experience
          </li>
          <li>
            <strong>Technical Support:</strong> Provide customer support and
            troubleshoot issues
          </li>
          <li>
            <strong>Legal Compliance:</strong> Comply with applicable laws and
            regulations
          </li>
        </ul>
      </section>

      {/* Information Sharing */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            4
          </span>
          Information Sharing and Disclosure
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          <strong>
            We do not sell, rent, or trade your personal information.
          </strong>{" "}
          We may share your information only in the following circumstances:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Within Family:</strong> Content you share is visible to
            other authenticated family members
          </li>
          <li>
            <strong>Service Providers:</strong> Trusted third-party services
            that help us operate the website (hosting, email services)
          </li>
          <li>
            <strong>Legal Requirements:</strong> When required by law, court
            order, or to protect rights and safety
          </li>
          <li>
            <strong>Business Transfer:</strong> In the event of a merger,
            acquisition, or sale of assets (with notice)
          </li>
          <li>
            <strong>Consent:</strong> When you explicitly consent to sharing
            with specific third parties
          </li>
        </ul>
      </section>

      {/* Data Security */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            5
          </span>
          Data Security
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          We implement comprehensive security measures to protect your
          information:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Encryption:</strong> All data transmission is encrypted
            using HTTPS/TLS protocols
          </li>
          <li>
            <strong>Password Security:</strong> Passwords are hashed and salted
            using industry-standard algorithms
          </li>
          <li>
            <strong>Access Controls:</strong> Strict authentication and
            authorization for family member access
          </li>
          <li>
            <strong>Regular Updates:</strong> Security patches and updates are
            applied promptly
          </li>
          <li>
            <strong>Monitoring:</strong> Continuous monitoring for suspicious
            activities and security threats
          </li>
          <li>
            <strong>Data Backup:</strong> Regular backups with secure storage to
            prevent data loss
          </li>
        </ul>
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 ml-11 mt-4">
          <p className="text-base">
            <strong>Important:</strong> While we implement robust security
            measures, no method of transmission over the internet is 100%
            secure. We cannot guarantee absolute security but are committed to
            protecting your information using industry best practices.
          </p>
        </div>
      </section>

      {/* Cookies and Tracking */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            6
          </span>
          Cookies and Tracking Technologies
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          We use cookies and similar technologies to enhance your experience:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Essential Cookies:</strong> Required for authentication,
            security, and basic website functionality
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your theme settings,
            language preferences, and layout choices
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand how you use
            the website to improve performance
          </li>
          <li>
            <strong>Session Storage:</strong> Temporary storage for your current
            session and form data
          </li>
        </ul>
        <p className="text-base leading-relaxed ml-11">
          You can control cookies through your browser settings, but disabling
          essential cookies may affect website functionality.
        </p>
      </section>

      {/* Data Retention */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            7
          </span>
          Data Retention
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          We retain your information for as long as necessary to provide our
          services:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Account Data:</strong> Retained while your account is active
            and for 1 year after deactivation
          </li>
          <li>
            <strong>Family Content:</strong> Preserved as long as family members
            wish to maintain shared memories
          </li>
          <li>
            <strong>Log Data:</strong> Automatically deleted after 90 days
            unless required for security investigations
          </li>
          <li>
            <strong>Communication Records:</strong> Retained for 2 years for
            family reference and dispute resolution
          </li>
        </ul>
      </section>

      {/* Your Rights */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            8
          </span>
          Your Privacy Rights
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          You have the following rights regarding your personal information:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Access:</strong> Request a copy of the personal information
            we hold about you
          </li>
          <li>
            <strong>Correction:</strong> Update or correct inaccurate personal
            information
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal
            information (subject to family content considerations)
          </li>
          <li>
            <strong>Portability:</strong> Receive your data in a structured,
            machine-readable format
          </li>
          <li>
            <strong>Restriction:</strong> Limit how we process your personal
            information
          </li>
          <li>
            <strong>Objection:</strong> Object to certain types of processing
          </li>
        </ul>
        <p className="text-base leading-relaxed ml-11">
          To exercise these rights, please contact us using the information
          provided below.
        </p>
      </section>

      {/* Children's Privacy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            9
          </span>
          Children's Privacy
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          Our family portal may include content related to children within our
          family. We are committed to protecting children's privacy:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            We do not knowingly collect personal information from children under
            13 without parental consent
          </li>
          <li>
            All children's content is shared privately within the family circle
            only
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
      </section>

      {/* Third-Party Services */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            10
          </span>
          Third-Party Services
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          Our website may integrate with third-party services to enhance
          functionality:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            <strong>Email Services:</strong> For account verification and
            password reset emails
          </li>
          <li>
            <strong>Cloud Storage:</strong> Secure storage of family photos and
            documents
          </li>
          <li>
            <strong>Analytics:</strong> Anonymous usage statistics to improve
            website performance
          </li>
          <li>
            <strong>CDN Services:</strong> Content delivery networks for faster
            loading times
          </li>
        </ul>
        <p className="text-base leading-relaxed ml-11">
          These services have their own privacy policies. We encourage you to
          review them when using integrated features.
        </p>
      </section>

      {/* International Users */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            11
          </span>
          International Data Transfers
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          If you are accessing our website from outside your country of
          residence, please note:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
          <li>
            Your information may be transferred to and processed in countries
            with different privacy laws
          </li>
          <li>
            We ensure appropriate safeguards are in place for international data
            transfers
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
      </section>

      {/* Changes to Policy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            12
          </span>
          Changes to This Privacy Policy
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or legal requirements:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4 ml-11">
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
      </section>

      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
            13
          </span>
          Contact Us
        </h2>
        <p className="text-base leading-relaxed mb-4 ml-11">
          If you have any questions, concerns, or requests regarding this
          Privacy Policy or our data practices, please contact us:
        </p>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 ml-11">
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-3 h-3 text-on-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <div>
                <strong>Email:</strong> REDACTED_MONGO_PASSWORD@gmail.com
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-3 h-3 text-on-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <strong>Response Time:</strong> We aim to respond within 48
                hours
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-3 h-3 text-on-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <strong>Subject Line:</strong> Please include "Privacy Policy"
                in your email subject
              </div>
            </div>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
};

export default PrivacyPolicyPage;
