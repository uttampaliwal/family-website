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
          your access to and use of our website and services. By accessing or
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

      <Section title="Termination" number={5}>
        <p className="text-base leading-relaxed mb-4">
          We may terminate or suspend your account and bar access to the Service
          immediately, without prior notice or liability, under our sole
          discretion, for any reason whatsoever and without limitation,
          including but not limited to a breach of the Terms.
        </p>
      </Section>

      <Section title="Governing Law" number={6}>
        <p className="text-base leading-relaxed mb-4">
          These Terms shall be governed and construed in accordance with the
          laws of our jurisdiction, without regard to its conflict of law
          provisions.
        </p>
      </Section>

      <Section title="Changes to Terms" number={7}>
        <p className="text-base leading-relaxed mb-4">
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. If a revision is material we will provide at
          least 30 days' notice prior to any new terms taking effect. What
          constitutes a material change will be determined at our sole
          discretion.
        </p>
      </Section>

      <Section title="Contact Us" number={8}>
        <p className="text-base leading-relaxed mb-4">
          If you have any questions about these Terms, please contact us.
        </p>
      </Section>
    </InfoPageLayout>
  );
};

export default TermsOfServicePage;
