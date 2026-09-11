"use client";

import { ArrowUpRight, Construction } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function FeaturePlaceholder({ description, title }: Readonly<{ description: string; title: string }>) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="protected-page-content">
      <div className="feature-placeholder">
        <div className="feature-placeholder-icon">
          <Construction size={22} />
        </div>
        <p className="eyebrow">{t.placeholder.foundationTitle}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <span>{t.placeholder.readyNextPhase}</span>
        <button type="button" className="secondary-button" onClick={() => router.push("/dashboard")}>
          {t.placeholder.backToDashboard} <ArrowUpRight size={15} />
        </button>
      </div>
    </div>
  );
}