import { AccessPanel } from "@/components/glass/access-panel";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getRecoveryCopy } from "@/lib/i18n/recovery";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { passwordResetEnabled } from "@/lib/auth/reset-policy";
import { PasswordRecoveryForm } from "@/components/npf/password-recovery-form";
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return buildPageMetadata({
    locale,
    path: "/reset-password",
    title: getRecoveryCopy(locale).title,
    description: getRecoveryCopy(locale).body,
    noIndex: true,
  });
}
export default async function RecoveryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/reset-password">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = getRecoveryCopy(locale);
  const query = await searchParams;
  const raw = typeof query.token === "string" ? query.token : undefined;
  const token = raw && /^[A-Za-z0-9_-]{16,256}$/.test(raw) ? raw : undefined;
  return (
    <AccessPanel eyebrow={getDictionary(locale).siteName} title={c.title} subtitle={c.body}>
      <PasswordRecoveryForm
        locale={locale}
        enabled={passwordResetEnabled()}
        token={token}
      />
    </AccessPanel>
  );
}
