import { InfoPage, InfoSection } from "../../components/layout/info-page.js";
import { useI18n } from "../../i18n/index.js";
import { useSeo } from "../../lib/seo.js";

export function PrivacyPolicyPage() {
  const { t } = useI18n();
  useSeo("legal.privacy.title");

  return (
    <InfoPage
      title={t("legal.privacy.title")}
      subtitle={t("legal.privacy.subtitle")}
    >
      <InfoSection n={1} title="What we collect">
        <p>
          When you join the family portal we collect the details you give us on
          registration: full name, email address, username, date of birth,
          gender, your relationship to the family, and an optional phone
          number. If you later add to your profile, we store that too.
        </p>
        <p>
          Everything you share in the portal — photos, documents, events,
          announcements, moments, chat messages — is stored so your family can
          see and use it. This content is the heart of the portal and stays
          within the family circle.
        </p>
      </InfoSection>

      <InfoSection n={2} title="How we use it">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To let you sign in and keep your account secure</li>
          <li>To show family content to approved family members only</li>
          <li>To send you verification, reset, and announcement emails</li>
          <li>To keep the service safe, fast, and working</li>
        </ul>
      </InfoSection>

      <InfoSection n={3} title="What we never do">
        <p>
          We never sell, rent, or trade your personal information to anyone.
          There is no advertising on the portal, so there is no ad-related
          sharing of any kind.
        </p>
      </InfoSection>

      <InfoSection n={4} title="Where data lives">
        <p>
          Your account data is stored in a private database, and photos and
          documents are kept in cloud object storage (Cloudflare R2) behind
          signed, revocable access. All traffic to the portal is encrypted with
          HTTPS. Passwords are hashed with a strong one-way algorithm and can
          never be read back.
        </p>
        <p>
          Sign-in sessions use secure cookies, and small amounts of data (theme,
          language) are kept in your browser's local storage so your
          preferences are remembered.
        </p>
      </InfoSection>

      <InfoSection n={5} title="Children's privacy">
        <p>
          The portal is a private family space and may include content about
          children in the family. That content is only visible to approved
          family members. If you believe anything is inappropriate or should be
          removed, contact us and we will take it down promptly.
        </p>
      </InfoSection>

      <InfoSection n={6} title="Your rights">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>See</strong> — ask for a copy of the information we hold
            about you
          </li>
          <li>
            <strong>Correct</strong> — fix anything that is out of date (you can
            edit most of your profile yourself)
          </li>
          <li>
            <strong>Delete</strong> — request removal of your account and
            personal data
          </li>
          <li>
            <strong>Export</strong> — ask for your data in a machine-readable
            format
          </li>
        </ul>
        <p>
          Send any request to the contact address below and we will respond
          within 48 hours.
        </p>
      </InfoSection>

      <InfoSection n={7} title="Changes to this policy">
        <p>
          If we change how we handle your data, we will update this page and
          let the family know through the portal. Continued use after a change
          means you accept the updated policy.
        </p>
      </InfoSection>
    </InfoPage>
  );
}