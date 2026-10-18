import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { SocialIcons } from "@/components/npf/social-icons";

export function NPFFooter({
  locale,
  dictionary: d,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const base = `/${locale}`;
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
    <footer className="ng-footer">
      <div className="ng-footer-card">
        <div className="ng-footer-grid">
          <div className="ng-stack" style={{ ["--ng-stack" as string]: "18px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local vector logo */}
            <img src="/npf-logo.svg" alt="" width={44} height={52} className="ng-footer-logo" />
            <p className="ng-body" style={{ maxInlineSize: "34ch" }}>
              {d.footer.description}
            </p>
            <a href={`mailto:${d.contact.email}`} className="ng-link">
              {d.contact.email}
            </a>
            <SocialIcons />
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map(([path, label]) => (
                  <li key={path}>
                    <Link href={`${base}/${path}`}>{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="ng-footer-base">
          <span>
            © {new Date().getFullYear()} {d.siteName}
          </span>
          <span style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <Link href={`${base}/terms`} className="ng-link">
              {d.footer.terms}
            </Link>
            <Link href={`${base}/privacy-policy`} className="ng-link">
              {d.footer.privacy}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
