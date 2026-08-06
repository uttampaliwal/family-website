import { useEffect } from "react";
import { useI18n } from "../i18n/provider.js";
import type { translations } from "../i18n/translations.js";

type Key = keyof typeof translations.en;

export function useSeo(titleKey: Key, descriptionKey?: Key) {
  const { lang, t } = useI18n();

  useEffect(() => {
    document.title = `${t(titleKey)} · ${t("brand.name")}`;

    if (descriptionKey) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", t(descriptionKey));
    }
  }, [titleKey, descriptionKey, lang, t]);
}