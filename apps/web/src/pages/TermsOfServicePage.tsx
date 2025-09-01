import React from "react";
import InfoPageLayout from "../components/InfoPageLayout";
import Section from "../components/Section";

const TermsOfServicePage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using our service."
    >
      <Section title="Introduction" number={1}>
        <p className="text-base leading-relaxed mb-4">
          Welcome to our Family Portal. These Terms of Service ("Terms") govern
          your access to and use of our portal and services. By accessing or
          using the Service, you agree to be bound by these Terms.
        </p>
      </Section>

      <Section title="User Accounts" number={2}>
        <p className="text-base leading-relaxed mb-4">
          To use certain features of our website, you must register for an
          account. You are responsible for safeguarding your account information
          and for all activities that occur under your account. You agree to
          notify us immediately of any unauthorized use of your account.
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Account Approval Process
        </h4>
        <p className="text-base leading-relaxed mb-4">
          All new user accounts require administrative approval before gaining
          full access to the platform. This approval process helps maintain the
          security and integrity of our family-oriented community. Account
          approval decisions are made at the sole discretion of our
          administrators and may be subject to verification requirements.
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Access Revocation
        </h4>
        <p className="text-base leading-relaxed mb-4">
          We reserve the right to immediately revoke access to any user account
          at our sole discretion, including but not limited to violations of
          these Terms, suspicious activity, or security concerns. Users will be
          notified via email when access is revoked, along with the reason for
          the action. Revoked users may appeal the decision through our support
          channels.
        </p>
      </Section>

      <Section title="User Content" number={3}>
        <p className="text-base leading-relaxed mb-4">
          Our Service allows you to post, link, store, share and otherwise make
          available certain information, text, graphics, videos, or other
          material ("Content"). You are responsible for the Content that you
          post on or through the Service, including its legality, reliability,
          and appropriateness.
        </p>
        <p className="text-base leading-relaxed mb-4">
          By posting Content on or through the Service, You represent and
          warrant that: (i) the Content is yours (you own it) and/or you have
          the right to use it and the right to grant us the rights and license
          as provided in these Terms, and (ii) the posting of your Content on or
          through the Service does not violate the privacy rights, publicity
          rights, copyrights, contract rights or any other rights of any person
          or entity.
        </p>
      </Section>

      <Section title="Prohibited Uses" number={4}>
        <p className="text-base leading-relaxed mb-4">
          You may use the Service only for lawful purposes and in accordance
          with these Terms. You agree not to use the Service:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4">
          <li>
            In any way that violates any applicable national or international
            law or regulation.
          </li>
          <li>
            For the purpose of exploiting, harming, or attempting to exploit or
            harm minors in any way by exposing them to inappropriate content or
            otherwise.
          </li>
          <li>
            To transmit, or procure the sending of, any advertising or
            promotional material, including any "junk mail", "chain letter,"
            "spam," or any other similar solicitation.
          </li>
          <li>
            To impersonate or attempt to impersonate the Company, a Company
            employee, another user, or any other person or entity.
          </li>
        </ul>
      </Section>

      <Section title="Administrative Roles and Promotion System" number={5}>
        <p className="text-base leading-relaxed mb-4">
          Our platform operates with a role-based access control system to
          ensure proper governance and security of the family portal.
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          User Roles
        </h4>
        <ul className="list-disc list-inside text-base space-y-2 mb-4">
          <li>
            <strong>Regular Users:</strong> Standard family members with access
            to basic platform features after account approval.
          </li>
          <li>
            <strong>Administrators:</strong> Trusted family members with
            elevated privileges to manage users, approve accounts, and maintain
            platform security.
          </li>
        </ul>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Admin Promotion Process
        </h4>
        <p className="text-base leading-relaxed mb-4">
          Verified users may be considered for administrative promotion through
          the following process:
        </p>
        <ul className="list-disc list-inside text-base space-y-2 mb-4">
          <li>
            Only verified users with good standing may be nominated for admin
            roles
          </li>
          <li>
            Admin promotion requires approval from at least two existing
            administrators
          </li>
          <li>
            Approved promotions have a 7-day waiting period before activation
          </li>
          <li>
            During the waiting period, any existing administrator may revoke the
            promotion if concerns arise
          </li>
          <li>
            All promotion activities are logged and audited for security
            purposes
          </li>
        </ul>
      </Section>

      <Section title="Termination" number={6}>
        <p className="text-base leading-relaxed mb-4">
          We may terminate or suspend your account and bar access to the Service
          immediately, without prior notice or liability, under our sole
          discretion, for any reason whatsoever and without limitation,
          including but not limited to a breach of the Terms.
        </p>
      </Section>

      <Section title="Security and Audit Logging" number={7}>
        <p className="text-base leading-relaxed mb-4">
          To maintain the security and integrity of our platform, we implement
          comprehensive audit logging and monitoring systems.
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Activity Monitoring
        </h4>
        <ul className="list-disc list-inside text-base space-y-2 mb-4">
          <li>
            All administrative actions are logged with timestamps, IP addresses,
            and detailed descriptions
          </li>
          <li>
            User account changes, including approvals, rejections, and access
            revocations, are permanently recorded
          </li>
          <li>
            Session management and authentication events are monitored for
            security purposes
          </li>
          <li>
            Critical actions require dual confirmation to prevent accidental or
            unauthorized changes
          </li>
        </ul>
        <p className="text-base leading-relaxed mb-4">
          These logs are used solely for security, troubleshooting, and
          compliance purposes and are protected according to our Privacy Policy.
        </p>
      </Section>

      <Section title="Governing Law" number={8}>
        <p className="text-base leading-relaxed mb-4">
          These Terms shall be governed and construed in accordance with the
          laws of our jurisdiction, without regard to its conflict of law
          provisions.
        </p>
      </Section>

      <Section title="Changes to Terms" number={9}>
        <p className="text-base leading-relaxed mb-4">
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. If a revision is material we will provide at
          least 30 days' notice prior to any new terms taking effect. What
          constitutes a material change will be determined at our sole
          discretion.
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Version History
        </h4>
        <p className="text-base leading-relaxed mb-4">
          We maintain a complete version history of all policy changes,
          including the date of changes, the administrator who made the changes,
          and a detailed changelog. This ensures transparency and accountability
          in our policy management.
        </p>
      </Section>

      <Section title="Contact Us" number={10}>
        <p className="text-base leading-relaxed mb-4">
          If you have any questions about these Terms, please contact us.
        </p>
      </Section>
    </InfoPageLayout>
  );
};

export default TermsOfServicePage;
