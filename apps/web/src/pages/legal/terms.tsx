import { InfoPage, InfoSection } from "../../components/layout/info-page.js";
import { useI18n } from "../../i18n/index.js";
import { useSeo } from "../../lib/seo.js";

export function TermsPage() {
  const { t } = useI18n();
  useSeo("legal.terms.title");

  return (
    <InfoPage title={t("legal.terms.title")} subtitle={t("legal.terms.subtitle")}>
      <InfoSection n={1} title="What the portal is">
        <p>
          Kulaya is a private online space for our family. It exists to share
          photos, documents, events, announcements, moments, and messages
          between approved family members. It is not a public service, and it
          is not open to anyone outside the family.
        </p>
      </InfoSection>

      <InfoSection n={2} title="Joining the portal">
        <p>
          Access is granted by invitation or request, and every new member must
          be approved by a family administrator before they can sign in. An
          account is for one person — please do not share yours. You are
          responsible for keeping your password safe and for everything done
          under your account.
        </p>
      </InfoSection>

      <InfoSection n={3} title="Content you share">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>You keep the rights to the content you share.</li>
          <li>
            By sharing, you give the family permission to view it within the
            portal — that is the point of the space.
          </li>
          <li>
            Please only share content you are entitled to share, and remember
            children and other family members deserve respect in what gets
            posted.
          </li>
          <li>
            We may remove content that is abusive, unlawful, or harmful to
            family members, with or without notice.
          </li>
        </ul>
      </InfoSection>

      <InfoSection n={4} title="Acceptable use">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>No harassment, hateful speech, or bullying of any member.</li>
          <li>No attempting to access accounts or data that are not yours.</li>
          <li>No posting others' private information without consent.</li>
          <li>No spamming, scams, or commercial promotion.</li>
        </ul>
      </InfoSection>

      <InfoSection n={5} title="Availability and changes">
        <p>
          We run the portal in good faith for the family, but we make no
          guarantee that it will be uninterrupted or error-free. Features may
          change over time, and content may occasionally be removed or
          corrected. A family administrator can close or restrict accounts that
          break these terms.
        </p>
      </InfoSection>

      <InfoSection n={6} title="Account deletion">
        <p>
          You can leave the portal at any time by asking an administrator to
          delete your account and your personal data. Shared content (photos,
          messages, moments) may remain in the family archive even after your
          account is removed.
        </p>
      </InfoSection>

      <InfoSection n={7} title="Contact">
        <p>
          Questions about these terms? Reach us through the contact page — we
          are family, and we will talk it through.
        </p>
      </InfoSection>
    </InfoPage>
  );
}