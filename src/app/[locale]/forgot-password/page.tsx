import { AccessFrame } from "@/components/care-atlas/access-frame";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getRecoveryCopy } from "@/lib/i18n/recovery";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { passwordResetEnabled } from "@/lib/auth/reset-policy";
import { PasswordRecoveryForm } from "@/components/npf/password-recovery-form";
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return buildPageMetadata({
    locale,
    path: "/forgot-password",
    title: getRecoveryCopy(locale).title,
    description: getRecoveryCopy(locale).body,
    noIndex: true,
  });
}
export default async function RecoveryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = getRecoveryCopy(locale);
  await searchParams;
  return (
    <AccessFrame title={c.title} subtitle={c.body}>
      <PasswordRecoveryForm locale={locale} enabled={passwordResetEnabled()} />
    </AccessFrame>
  );
}
