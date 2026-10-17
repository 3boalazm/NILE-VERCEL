import { EditorialVisual } from "@/components/care-atlas/editorial-visual";
import { productRepository } from "@/lib/products";
import { readCms } from "@/lib/cms/read";
import { getExperienceCopy } from "@/lib/i18n/experience";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { NPFContactForm } from "@/components/npf/contact-form";
import { PageIntro } from "@/components/care-atlas/sections";
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
    <>
      <PageIntro
        index="NPF / AN OPEN CONVERSATION"
        title={dictionary.contact.pageTitle}
        accent={c.contact2}
        body={c.contactBody}
      />
      <div className="ca-contact-page ca-section-pad">
        <section className="ca-contact-form-panel">
          <div className="ca-section-index">
            <span className="ca-mono">01 / YOUR MESSAGE</span>
          </div>
          <h2>{dictionary.contact.formTitle}</h2>
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
          <p>{dictionary.contact.responseNote}</p>
        </section>
        <aside className="ca-contact-address">
          <span className="ca-mono">02 / FIND US</span>
          <h2>{dictionary.contact.infoTitle}</h2>
          <ul>
            {infoItems.map((item) => (
              <li key={item.label}>
                <item.icon size={22} aria-hidden="true" />
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
            className="ca-map-link"
            href={`https://maps.google.com/maps?q=${encodeURIComponent(dictionary.contact.address)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {locale === "ar"
              ? "افتح الموقع على Google Maps"
              : "Open our location in Google Maps"}
            <span aria-hidden="true">↗</span>
          </a>
          <p>
            {locale === "ar"
              ? "الخريطة تفتح خارجيًا عند اختيارك للرابط."
              : "The external map opens only when you follow the link."}
          </p>
          <EditorialVisual
            kind="contact"
            locale={locale}
            className="ca-editorial-contact"
          />
        </aside>
      </div>
    </>
  );
}
