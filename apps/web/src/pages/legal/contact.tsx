import { useState, type FormEvent } from "react";
import { Mail, Send } from "lucide-react";
import { Button, Input, Label, Textarea } from "@family/ui";
import { Field } from "../../components/auth/field.js";
import { InfoPage } from "../../components/layout/info-page.js";
import { useI18n } from "../../i18n/index.js";
import { useSeo } from "../../lib/seo.js";

const CONTACT_EMAIL = "hello@kulaya.family";

export function ContactPage() {
  const { t } = useI18n();
  useSeo("legal.contact.title");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = encodeURIComponent(`From: ${name} (${email})\n\n${message}`);
    const mail = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mail;
  }

  return (
    <InfoPage title={t("legal.contact.title")} subtitle={t("legal.contact.subtitle")}>
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Mail className="size-4" />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-foreground">{CONTACT_EMAIL}</p>
          <p className="mt-0.5 text-muted">{t("legal.contact.response")}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("legal.contact.name")} htmlFor="contact-name">
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label={t("legal.contact.email")} htmlFor="contact-email">
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label={t("legal.contact.subject")} htmlFor="contact-subject">
          <Input
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </Field>
        <Field label={t("legal.contact.message")} htmlFor="contact-message">
          <Textarea
            id="contact-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" className="w-full sm:w-auto">
          <Send />
          {t("legal.contact.send")}
        </Button>
        <p className="text-xs text-muted">
          <Label className="font-normal">{t("legal.contact.mailtoNote")}</Label>
        </p>
      </form>
    </InfoPage>
  );
}