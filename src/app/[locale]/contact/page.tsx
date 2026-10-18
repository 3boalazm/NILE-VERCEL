import { productRepository } from "@/lib/products";
import { readCms } from "@/lib/cms/read";
import { getExperienceCopy } from "@/lib/i18n/experience";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { NPFContactForm } from "@/components/npf/contact-form";
import { PageIntro } from "@/components/glass/sections";
import { EditorialFigure } from "@/components/glass/content";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const dictionary = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/contact",
    title: dictionary.contact.pageTitle,
    description: dictionary.contact.pageSubtitle,
  });
}

export default async function ContactPage({
  params,
  searchParams,
}: PageProps<"/[locale]/contact">) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);
  const base = `/${locale}`;

  const query = await searchParams;
  const slug =
    typeof query.product === "string" &&
    /^[a-z0-9-]{1,120}$/.test(query.product)
      ? query.product
      : undefined;
  // The product in the enquiry is a prefill nicety. If the CMS cannot be
  // read, the contact form must still work — it just starts without a
  // product name.
  const productRead = slug
    ? await readCms("contact:product", () =>
        productRepository.getProductBySlug(slug),
      )
    : null;
  const product = productRead?.status === "ok" ? productRead.value : null;
  const initialSubject = product
    ? `${getExperienceCopy(locale).contactContext}: ${product.name}`.slice(
        0,
        200,
      )
    : undefined;

  // Phone/email are tappable links (tap-to-call matters on mobile);
  // numbers stay LTR so the " / " separator never flips in RTL.
  // First number only — a tel: link can't dial two numbers at once.
  const infoItems: Array<{
    icon: typeof MapPinIcon;
    label: string;
    href?: string;
  }> = [
    { icon: MapPinIcon, label: dictionary.contact.address },
    {
      icon: PhoneIcon,
      label: dictionary.contact.phone,
      href: `tel:${dictionary.contact.phone.split(" / ")[0].replace(/\s/g, "")}`,
    },
    {
      icon: MailIcon,
      label: dictionary.contact.email,
      href: `mailto:${dictionary.contact.email}`,
    },
  ];

  const c = getCareAtlasCopy(locale);
  return (
    <div className="ng-content">
      <PageIntro
        eyebrow={c.contactLabel}
        title={dictionary.contact.pageTitle}
        accent={c.contact2}
        body={c.contactBody}
      />
      <div className="ng-wrap ng-band-tight ng-contact-grid" style={{ paddingBlockEnd: "clamp(56px, 8vw, 112px)" }}>
        <section className="ng-glass ng-form-panel" aria-labelledby="contact-form-title">
          <div className="ng-stack" style={{ ["--ng-stack" as string]: "8px" }}>
            <h2 id="contact-form-title" className="ng-h3">
              {dictionary.contact.formTitle}
            </h2>
          </div>
          <NPFContactForm
            key={product?.slug ?? "general"}
            initialSubject={initialSubject}
            locale={locale}
            dictionary={dictionary.contact}
            contactEmail={dictionary.contact.email}
            routing={dictionary.contact.routing}
            routingTitle={dictionary.contact.routingTitle}
            routingBody={dictionary.contact.routingBody}
            careers={{ href: `${base}/careers`, label: dictionary.contact.routingCareers }}
          />
          <p className="ng-muted ng-small">{dictionary.contact.responseNote}</p>
        </section>
        <aside className="ng-sticky" aria-labelledby="contact-info-title">
          <div className="ng-tile">
            <h2 id="contact-info-title" className="ng-h3">
              {dictionary.contact.infoTitle}
            </h2>
            <ul className="ng-contact-list">
              {infoItems.map((item) => (
                <li key={item.label}>
                  <span className="ng-contact-icon">
                    <item.icon size={20} aria-hidden="true" />
                  </span>
                  {item.href ? (
                    <a href={item.href} dir="ltr">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
            <a
              className="ng-btn ng-btn-ghost"
              style={{ inlineSize: "100%" }}
              href={`https://maps.google.com/maps?q=${encodeURIComponent(dictionary.contact.address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {locale === "ar"
                ? "افتح الموقع على Google Maps"
                : "Open our location in Google Maps"}
              <span className="ng-arrow" aria-hidden="true">↗</span>
            </a>
            <p className="ng-muted ng-small">
              {locale === "ar"
                ? "الخريطة تفتح خارجيًا عند اختيارك للرابط."
                : "The external map opens only when you follow the link."}
            </p>
          </div>
          <EditorialFigure kind="contact" locale={locale} sizes="(min-width: 1000px) 40vw, 100vw" />
        </aside>
      </div>
    </div>
  );
}
