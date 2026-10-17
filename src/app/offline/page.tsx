import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لا يوجد اتصال بالإنترنت",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> so this
          offline fallback caches on the SVG's own URL, not next/image's /_next/image
          proxy route (which needs its own separate precache entry). */}
      <img src="/npf-logo.svg" alt="نايل فارما فود" className="mb-2 h-10 w-auto" />
      <h1 className="text-xl font-semibold">لا يوجد اتصال بالإنترنت</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        لحماية خصوصيتك، صفحات الحساب والطلبات مش بتتحفظ أوفلاين. ارجع لما يرجع الاتصال وحاول تاني.
        <span lang="en" dir="ltr" className="mt-3 block">For your privacy, account and order pages are never saved offline. Reconnect and try again.</span>
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate
          full browser navigation, not next/link's client-side router: offline,
          the router's RSC-payload fetch would just fail, while a real navigation
          lets the browser + service worker retry against the network. */}
      <a
        href="/"
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        إعادة المحاولة
      </a>
    </main>
  );
}
