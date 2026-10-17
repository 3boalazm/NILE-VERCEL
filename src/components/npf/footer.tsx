import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";

export function NPFFooter({
  locale,
  dictionary: d,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const base = `/${locale}`,
    c = getCareAtlasCopy(locale);
  const columns = [
    {
      title: d.footer.companyGroup,
      links: [
        ["about", d.nav.about],
        ["story", d.nav.story],
        ["quality-sourcing", d.nav.quality],
        ["careers", d.nav.careers],
      ],
    },
    {
      title: d.footer.productsGroup,
      links: [
        ["products", d.products.pageTitle],
        ["products?category=supplements", d.footer.categorySupplements],
        ["products?category=medical-devices", d.footer.categoryMedicalDevices],
        ["wishlist", d.wishlist.navLabel],
      ],
    },
    {
      title: d.footer.contactGroup,
      links: [
        ["contact", d.nav.contact],
        ["shipping-delivery", d.footer.shipping],
        ["account", d.auth.accountNavLabel],
        ["cart", d.nav.cart],
      ],
    },
  ];
  return (
    <footer className="ca-footer">
      <div className="ca-footer-index">
        <div>
          <span className="ca-mono">CARE, WITH UNDERSTANDING.</span>
          <p>{d.footer.description}</p>
          <a href={`mailto:${d.contact.email}`}>{d.contact.email} ↗</a>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2>{col.title}</h2>
            {col.links.map(([path, label]) => (
              <Link key={path} href={`${base}/${path}`}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="ca-footer-wordmark" aria-hidden="true">
        NILE PHARMA FOOD<span>EG</span>
      </div>
      <div className="ca-footer-bottom">
        <span>
          © {new Date().getFullYear()} {d.siteName}
        </span>
        <Link href={`${base}/terms`}>{d.footer.terms}</Link>
        <Link href={`${base}/privacy-policy`}>{d.footer.privacy}</Link>
        <span className="ca-footer-art-note">{c.imageNote}</span>
      </div>
    </footer>
  );
}
