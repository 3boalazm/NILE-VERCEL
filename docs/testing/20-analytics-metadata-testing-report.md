# NPF Storefront - Analytics & Metadata Testing Report

## 📋 Table of Contents
1. [Introduction](#-introduction)
2. [Test Environment](#-test-environment)
3. [Test Scope](#-test-scope)
4. [Analytics & Metadata Architecture Overview](#-analytics--metadata-architecture-overview)
5. [Detailed Test Cases](#-detailed-test-cases)
6. [Test Results](#-test-results)
7. [Issues Found](#-issues-found)
8. [Recommendations](#-recommendations)
9. [Conclusion](#-conclusion)

---

## 📌 Introduction

### Purpose
This document provides a comprehensive Analytics & Metadata Testing report for the NPF (Nile Pharma Food) Storefront application. Analytics tracking and metadata are critical for understanding user behavior, measuring business performance, optimizing SEO, and ensuring proper integration with search engines and third-party platforms. Proper testing ensures that analytics data is accurate, complete, and actionable, while metadata is correct, consistent, and optimized for search engines and social media.

### Scope
This report covers:
- **Analytics Implementation**: Google Analytics 4 (GA4), tag management, event tracking
- **Conversion Tracking**: E-commerce events, goal tracking, funnel analysis
- **User Behavior Tracking**: Page views, sessions, user journeys, heatmaps
- **Custom Event Tracking**: Button clicks, form submissions, feature usage
- **Metadata**: Meta tags, Open Graph, Twitter Cards, structured data
- **SEO Metadata**: Title tags, meta descriptions, canonical URLs, hreflang
- **Schema Markup**: JSON-LD, Microdata, Rich snippets
- **Social Media Metadata**: Open Graph tags, Twitter Cards
- **PWA Metadata**: Manifest, theme colors, icons
- **Email Tracking**: Email opens, clicks, conversions (if applicable)
- **Ad Tracking**: Campaign tracking, UTM parameters, conversion pixels
- **Privacy & Compliance**: Cookie consent, GDPR compliance, data privacy
- **Data Accuracy**: Data validation, data consistency, data completeness
- **Analytics Performance**: Impact on page load, script loading
- **Cross-Platform Analytics**: Desktop, mobile, tablet analytics
- **Cross-Browser Analytics**: Chrome, Firefox, Safari, Edge analytics

### Audience
- Marketing Team
- SEO Specialists
- Frontend Developers
- Data Analysts
- Product Managers
- Stakeholders

---

## 🏗️ Test Environment

### Hardware Specifications
| Component | Details |
|-----------|---------|
| CPU | Intel i7-12700H / AMD Ryzen 9 6900HX |
| RAM | 16GB DDR4 |
| Storage | 512GB NVMe SSD |
| Display | 1920x1080, 2560x1440, 375x667 (mobile) |

### Software Specifications
| Component | Version |
|-----------|---------|
| Operating Systems | Ubuntu 22.04 LTS, macOS Ventura 13.5+, Windows 11, iOS 17+, Android 14 |
| Browsers | Chrome 120+, Firefox 120+, Safari 17+, Edge 120+ |
| Next.js | 16.3.3 |
| React | 19.2.8 |

### Test Tools
| Tool | Version | Purpose |
|------|---------|---------|
| Google Analytics 4 | Latest | Analytics testing |
| Google Tag Assistant | Latest | Tag verification |
| Google Tag Manager | Latest | Tag management testing |
| Google Search Console | Latest | SEO metadata testing |
| Google Rich Results Test | Latest | Structured data testing |
| Schema Markup Validator | Latest | Schema validation |
| Facebook Sharing Debugger | Latest | Open Graph testing |
| Twitter Card Validator | Latest | Twitter Card testing |
| LinkedIn Post Inspector | Latest | LinkedIn metadata testing |
| Playwright | 1.63.0 | Automated metadata testing |
| Vitest | 5.0.1 | Unit testing for analytics code |
| Chrome DevTools | Built-in | Network inspection, console logging |
| Charles Proxy | Latest | Network request inspection |
| Screaming Frog SEO Spider | Latest | Metadata crawling |
| Ahrefs / SEMrush | Latest | SEO metadata analysis |
| Lighthouse | 10+ | SEO and metadata auditing |
| Cookiebot / OneTrust | Latest | Cookie consent testing |

---

## 🎯 Test Scope

### In Scope
✅ **Analytics Implementation**: GA4 setup, gtag.js loading, data layer
✅ **Page View Tracking**: Page views, virtual page views, SPA navigation
✅ **Event Tracking**: Clicks, form submissions, downloads, video plays
✅ **E-commerce Tracking**: Product views, add to cart, checkout, purchases
✅ **User Tracking**: User ID, demographics, interests, custom dimensions
✅ **Conversion Tracking**: Goals, funnels, conversion events
✅ **Custom Dimensions & Metrics**: Custom data collection
✅ **Tag Management**: Google Tag Manager, tag firing rules
✅ **Meta Tags**: Title, description, keywords, robots
✅ **Open Graph Metadata**: og:title, og:description, og:image, og:url, og:type
✅ **Twitter Card Metadata**: twitter:card, twitter:title, twitter:description, twitter:image
✅ **Structured Data**: JSON-LD, Schema.org markup (Organization, Product, Breadcrumb, etc.)
✅ **Canonical URLs**: Canonical tags, alternate URLs
✅ **Hreflang Tags**: Language alternatives for international SEO
✅ **PWA Metadata**: Manifest, theme colors, icons, apple-touch-icon
✅ **Favicon & App Icons**: All icon sizes and formats
✅ **Email Metadata**: Email tracking, UTM parameters
✅ **Campaign Tracking**: UTM parameters, campaign attribution
✅ **Privacy & Compliance**: Cookie consent, GDPR, data retention
✅ **Data Accuracy**: Data validation, consistency, completeness
✅ **Analytics Performance**: Script loading impact, page load impact
✅ **Cross-Platform Analytics**: Desktop, mobile, tablet
✅ **Cross-Browser Analytics**: All major browsers

### Out of Scope
❌ General SEO testing beyond metadata (covered in SEO Testing Report)
❌ General performance testing beyond analytics impact (covered in Performance Testing Report)
❌ General security testing beyond data privacy (covered in Security Testing Report)
❌ A/B testing setup and analysis
❌ Business intelligence and reporting

---

## 📊 Analytics & Metadata Architecture Overview

### Analytics Stack

#### Google Analytics 4 (GA4)
- **Implementation**: gtag.js or Google Tag Manager
- **Measurement ID**: G-XXXXXXXXXX (to be configured)
- **Data Layer**: `window.dataLayer` for custom data
- **Events**: Automatic and custom events
- **Enhanced Measurement**: Page views, scrolls, outbound clicks, site search, video engagement, file downloads

#### Google Tag Manager (GTM)
- **Container ID**: GTM-XXXXXXX (to be configured)
- **Tags**: GA4, conversion pixels, remarketing tags
- **Triggers**: Page views, clicks, form submissions
- **Variables**: Built-in and custom variables
- **Data Layer Events**: Custom events for tracking

#### Other Analytics (if used)
- **Facebook Pixel**: For Facebook/Instagram advertising
- **Google Ads**: For Google Ads conversion tracking
- **Hotjar / Microsoft Clarity**: For heatmaps and session recordings
- **Sentry / Datadog**: For error tracking (covered in Error Handling report)

### Analytics Events

#### Automatic Events (GA4 Enhanced Measurement)
1. `page_view` - Page views
2. `scroll` - Scrolls (90% depth)
3. `click` - Outbound clicks
4. `view_search_results` - Site search
5. `video_start`, `video_progress`, `video_complete` - Video engagement
6. `file_download` - File downloads

#### Custom E-commerce Events
1. `view_item` - Product detail view
2. `view_item_list` - Product listing view
3. `select_item` - Product selection
4. `add_to_cart` - Add to cart
5. `remove_from_cart` - Remove from cart
6. `view_cart` - Cart view
7. `begin_checkout` - Checkout start
8. `add_shipping_info` - Shipping info added
9. `add_payment_info` - Payment info added
10. `purchase` - Purchase completed
11. `refund` - Refund processed

#### Custom Engagement Events
1. `login` - User login
2. `sign_up` - User registration
3. `search` - Search performed
4. `add_to_wishlist` - Add to wishlist
5. `remove_from_wishlist` - Remove from wishlist
6. `contact_form_submit` - Contact form submission
7. `newsletter_signup` - Newsletter subscription
8. `share` - Social share
9. `download` - File download
10. `click_banner` - Banner/promo click

### Metadata Structure

#### HTML Meta Tags
```html
<!-- Primary Meta Tags -->
<title>Nile Pharma Food - Premium Food Supplements | NPF Egypt</title>
<meta name="description" content="...">
<meta name="keywords" content="...">
<meta name="robots" content="index, follow">
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Canonical URL -->
<link rel="canonical" href="https://nilepharmafood.com/ar">

<!-- Hreflang Tags -->
<link rel="alternate" hreflang="ar" href="https://nilepharmafood.com/ar">
<link rel="alternate" hreflang="en" href="https://nilepharmafood.com/en">
<link rel="alternate" hreflang="x-default" href="https://nilepharmafood.com">
```

#### Open Graph Meta Tags
```html
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://nilepharmafood.com/ar">
<meta property="og:title" content="Nile Pharma Food">
<meta property="og:description" content="...">
<meta property="og:image" content="https://nilepharmafood.com/products/proxeed-plus.jpg">
<meta property="og:image:width" content="1000">
<meta property="og:image:height" content="1000">
<meta property="og:site_name" content="Nile Pharma Food">
<meta property="og:locale" content="ar_EG">
<meta property="og:locale:alternate" content="en_US">
```

#### Twitter Card Meta Tags
```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Nile Pharma Food">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://nilepharmafood.com/products/proxeed-plus.jpg">
```

#### Structured Data (JSON-LD)
```html
<!-- Organization Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nile Pharma Food",
  "url": "https://nilepharmafood.com",
  "logo": "https://nilepharmafood.com/npf-logo.svg",
  "email": "info@nilepharmafood.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+20-XXX-XXX-XXXX",
    "contactType": "customer service",
    "areaServed": "EG",
    "availableLanguage": ["Arabic", "English"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "EG",
    "addressRegion": "Cairo",
    "addressLocality": "Cairo"
  },
  "sameAs": [
    "https://www.facebook.com/nilepharmafood",
    "https://www.instagram.com/nilepharmafood",
    "https://www.linkedin.com/company/nilepharmafood"
  ]
}
</script>

<!-- Product Schema (for product pages) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Proxeed Plus",
  "image": "https://nilepharmafood.com/products/proxeed-plus.jpg",
  "description": "...",
  "sku": "SKU-001",
  "brand": {
    "@type": "Brand",
    "name": "Alfasigma"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://nilepharmafood.com/ar/products/proxeed-plus",
    "priceCurrency": "EGP",
    "price": "500",
    "availability": "https://schema.org/InStock"
  }
}
</script>

<!-- Breadcrumb Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://nilepharmafood.com/ar"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://nilepharmafood.com/ar/products"
    }
  ]
}
</script>
```

#### PWA Metadata
```html
<!-- PWA -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0066cc">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
```

---

## 📝 Detailed Test Cases

### 1. Analytics Implementation Testing

#### Test Case ANA-IMPL-001: GA4 Installation
- **ID**: ANA-IMPL-001
- **Description**: Verify Google Analytics 4 is installed correctly
- **Test Steps**:
  1. Open site in browser
  2. Check for gtag.js or GTM container in page source
  3. Verify GA4 measurement ID is correct
  4. Check for dataLayer initialization
  5. Verify no JavaScript errors in console
- **Expected Result**: GA4 is installed correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Chrome DevTools, Google Tag Assistant

#### Test Case ANA-IMPL-002: GA4 Data Collection
- **ID**: ANA-IMPL-002
- **Description**: Verify GA4 is collecting data
- **Test Steps**:
  1. Open site in browser
  2. Navigate to different pages
  3. Check GA4 Real-Time reports
  4. Verify page views are being tracked
  5. Verify data appears in GA4 reports
- **Expected Result**: GA4 is collecting data correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Google Analytics 4

#### Test Case ANA-IMPL-003: Google Tag Manager
- **ID**: ANA-IMPL-003
- **Description**: Verify Google Tag Manager is installed correctly (if used)
- **Test Steps**:
  1. Check for GTM container in page source
  2. Verify GTM container ID is correct
  3. Check GTM debug mode
  4. Verify tags are firing correctly
  5. Check for any tag errors
- **Expected Result**: Google Tag Manager is installed correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Google Tag Assistant, GTM Preview mode

#### Test Case ANA-IMPL-004: Data Layer Implementation
- **ID**: ANA-IMPL-004
- **Description**: Verify data layer is implemented correctly
- **Test Steps**:
  1. Check for dataLayer in page source
  2. Verify dataLayer is initialized before tags fire
  3. Check dataLayer contains required data
  4. Verify custom data is pushed to dataLayer
- **Expected Result**: Data layer is implemented correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Chrome DevTools, Google Tag Assistant

#### Test Case ANA-IMPL-005: Analytics Script Loading
- **ID**: ANA-IMPL-005
- **Description**: Verify analytics scripts load correctly
- **Test Steps**:
  1. Check for analytics scripts in page source
  2. Verify scripts are loaded asynchronously
  3. Check scripts don't block page rendering
  4. Verify scripts load on all pages
- **Expected Result**: Analytics scripts load correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Chrome DevTools, Lighthouse

#### Test Case ANA-IMPL-006: Analytics in Both Locales
- **ID**: ANA-IMPL-006
- **Description**: Verify analytics work in both Arabic and English
- **Test Steps**:
  1. Navigate to Arabic pages
  2. Verify analytics events are tracked
  3. Navigate to English pages
  4. Verify analytics events are tracked
  5. Check locale is recorded in analytics
- **Expected Result**: Analytics work in both locales
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Google Analytics 4, Chrome DevTools

### 2. Page View Tracking Testing

#### Test Case ANA-PV-001: Initial Page View
- **ID**: ANA-PV-001
- **Description**: Verify initial page view is tracked
- **Test Steps**:
  1. Open site in browser
  2. Verify page_view event is fired
  3. Check page URL is recorded correctly
  4. Verify page title is recorded
  5. Check referrer is recorded
- **Expected Result**: Initial page view is tracked correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-PV-002: SPA Navigation Page Views
- **ID**: ANA-PV-002
- **Description**: Verify SPA navigation page views are tracked
- **Test Steps**:
  1. Navigate between pages using Next.js Link
  2. Verify page_view events are fired for each navigation
  3. Check page URLs are updated correctly
  4. Verify no duplicate page views
- **Expected Result**: SPA navigation page views are tracked correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-PV-003: Virtual Page Views
- **ID**: ANA-PV-003
- **Description**: Verify virtual page views are tracked (if used)
- **Test Steps**:
  1. Trigger virtual page view (e.g., modal open)
  2. Verify virtual page_view event is fired
  3. Check virtual page URL is recorded
- **Expected Result**: Virtual page views are tracked correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-PV-004: Page View Parameters
- **ID**: ANA-PV-004
- **Description**: Verify page view parameters are correct
- **Test Steps**:
  1. Navigate to a page
  2. Check page_location parameter
  3. Check page_title parameter
  4. Check page_referrer parameter
  5. Verify all parameters are accurate
- **Expected Result**: Page view parameters are correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

### 3. E-commerce Event Tracking Testing

#### Test Case ANA-ECOM-001: View Item Event
- **ID**: ANA-ECOM-001
- **Description**: Verify view_item event is tracked
- **Test Steps**:
  1. Navigate to product detail page
  2. Verify view_item event is fired
  3. Check event parameters (item_id, item_name, price, etc.)
  4. Verify item data is accurate
- **Expected Result**: view_item event is tracked correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-002: View Item List Event
- **ID**: ANA-ECOM-002
- **Description**: Verify view_item_list event is tracked
- **Test Steps**:
  1. Navigate to product listing page
  2. Verify view_item_list event is fired
  3. Check event parameters (item_list_id, item_list_name, items)
  4. Verify item list data is accurate
- **Expected Result**: view_item_list event is tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-003: Add to Cart Event
- **ID**: ANA-ECOM-003
- **Description**: Verify add_to_cart event is tracked
- **Test Steps**:
  1. Add product to cart
  2. Verify add_to_cart event is fired
  3. Check event parameters (item_id, item_name, price, quantity, value)
  4. Verify cart data is accurate
- **Expected Result**: add_to_cart event is tracked correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-004: Remove from Cart Event
- **ID**: ANA-ECOM-004
- **Description**: Verify remove_from_cart event is tracked
- **Test Steps**:
  1. Remove product from cart
  2. Verify remove_from_cart event is fired
  3. Check event parameters
  4. Verify cart data is accurate
- **Expected Result**: remove_from_cart event is tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-005: Begin Checkout Event
- **ID**: ANA-ECOM-005
- **Description**: Verify begin_checkout event is tracked
- **Test Steps**:
  1. Start checkout process
  2. Verify begin_checkout event is fired
  3. Check event parameters (value, currency, items)
  4. Verify checkout data is accurate
- **Expected Result**: begin_checkout event is tracked correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-006: Add Shipping Info Event
- **ID**: ANA-ECOM-006
- **Description**: Verify add_shipping_info event is tracked
- **Test Steps**:
  1. Enter shipping information
  2. Verify add_shipping_info event is fired
  3. Check event parameters
- **Expected Result**: add_shipping_info event is tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-007: Add Payment Info Event
- **ID**: ANA-ECOM-007
- **Description**: Verify add_payment_info event is tracked
- **Test Steps**:
  1. Enter payment information
  2. Verify add_payment_info event is fired
  3. Check event parameters
- **Expected Result**: add_payment_info event is tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-008: Purchase Event
- **ID**: ANA-ECOM-008
- **Description**: Verify purchase event is tracked
- **Test Steps**:
  1. Complete a purchase
  2. Verify purchase event is fired
  3. Check event parameters (transaction_id, value, currency, items)
  4. Verify purchase data is accurate
  5. Check transaction is recorded in GA4
- **Expected Result**: purchase event is tracked correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-ECOM-009: Refund Event
- **ID**: ANA-ECOM-009
- **Description**: Verify refund event is tracked (if applicable)
- **Test Steps**:
  1. Process a refund
  2. Verify refund event is fired
  3. Check event parameters
- **Expected Result**: refund event is tracked correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

### 4. Custom Event Tracking Testing

#### Test Case ANA-CUST-001: Login Event
- **ID**: ANA-CUST-001
- **Description**: Verify login event is tracked
- **Test Steps**:
  1. Login to account
  2. Verify login event is fired
  3. Check event parameters
  4. Verify user ID is set (if applicable)
- **Expected Result**: login event is tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-002: Sign Up Event
- **ID**: ANA-CUST-002
- **Description**: Verify sign_up event is tracked
- **Test Steps**:
  1. Register new account
  2. Verify sign_up event is fired
  3. Check event parameters
- **Expected Result**: sign_up event is tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-003: Search Event
- **ID**: ANA-CUST-003
- **Description**: Verify search event is tracked
- **Test Steps**:
  1. Perform a search
  2. Verify search event is fired
  3. Check event parameters (search_term)
  4. Verify search results are recorded
- **Expected Result**: search event is tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-004: Add to Wishlist Event
- **ID**: ANA-CUST-004
- **Description**: Verify add_to_wishlist event is tracked
- **Test Steps**:
  1. Add product to wishlist
  2. Verify add_to_wishlist event is fired
  3. Check event parameters
- **Expected Result**: add_to_wishlist event is tracked correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-005: Contact Form Submission Event
- **ID**: ANA-CUST-005
- **Description**: Verify contact_form_submit event is tracked
- **Test Steps**:
  1. Submit contact form
  2. Verify contact_form_submit event is fired
  3. Check event parameters
- **Expected Result**: contact_form_submit event is tracked correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-006: Share Event
- **ID**: ANA-CUST-006
- **Description**: Verify share event is tracked (if applicable)
- **Test Steps**:
  1. Share content via social media
  2. Verify share event is fired
  3. Check event parameters (method, content_type)
- **Expected Result**: share event is tracked correctly
- **Priority**: Low
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-007: Download Event
- **ID**: ANA-CUST-007
- **Description**: Verify download event is tracked
- **Test Steps**:
  1. Download a file
  2. Verify download event is fired
  3. Check event parameters (file_name, file_extension)
- **Expected Result**: download event is tracked correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-008: Scroll Tracking
- **ID**: ANA-CUST-008
- **Description**: Verify scroll tracking works
- **Test Steps**:
  1. Scroll down a page
  2. Verify scroll event is fired at 90% depth
  3. Check event parameters (percent_scrolled)
- **Expected Result**: Scroll tracking works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-009: Outbound Click Tracking
- **ID**: ANA-CUST-009
- **Description**: Verify outbound click tracking works
- **Test Steps**:
  1. Click on outbound link
  2. Verify click event is fired
  3. Check event parameters (link_url, link_domain)
- **Expected Result**: Outbound click tracking works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CUST-010: Video Engagement Tracking
- **ID**: ANA-CUST-010
- **Description**: Verify video engagement tracking works (if videos exist)
- **Test Steps**:
  1. Play a video
  2. Verify video_start event is fired
  3. Pause and verify video_progress event
  4. Complete video and verify video_complete event
- **Expected Result**: Video engagement tracking works correctly
- **Priority**: Low
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

### 5. Conversion Tracking Testing

#### Test Case ANA-CONV-001: Goal Setup
- **ID**: ANA-CONV-001
- **Description**: Verify conversion goals are set up correctly
- **Test Steps**:
  1. Check GA4 conversion events configuration
  2. Verify key events are marked as conversions
  3. Check conversion goals (purchase, sign_up, contact)
  4. Verify conversion attribution settings
- **Expected Result**: Conversion goals are set up correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Google Analytics 4

#### Test Case ANA-CONV-002: E-commerce Funnel Tracking
- **ID**: ANA-CONV-002
- **Description**: Verify e-commerce funnel tracking works
- **Test Steps**:
  1. Go through complete purchase funnel
  2. Verify each funnel step is tracked
  3. Check funnel visualization in GA4
  4. Verify funnel drop-off data
- **Expected Result**: E-commerce funnel tracking works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Google Analytics 4

#### Test Case ANA-CONV-003: Conversion Attribution
- **ID**: ANA-CONV-003
- **Description**: Verify conversion attribution works correctly
- **Test Steps**:
  1. Visit site with UTM parameters
  2. Complete a conversion
  3. Verify conversion is attributed to correct source/medium
  4. Check attribution model settings
- **Expected Result**: Conversion attribution works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Google Analytics 4

### 6. User Tracking Testing

#### Test Case ANA-USER-001: User ID Tracking
- **ID**: ANA-USER-001
- **Description**: Verify user ID tracking works
- **Test Steps**:
  1. Login to account
  2. Verify user ID is set in analytics
  3. Check user ID persists across sessions
  4. Verify user ID is not exposed in client
- **Expected Result**: User ID tracking works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-USER-002: Session Tracking
- **ID**: ANA-USER-002
- **Description**: Verify session tracking works correctly
- **Test Steps**:
  1. Navigate through site
  2. Verify session is tracked
  3. Check session duration is recorded
  4. Verify new session starts after timeout
- **Expected Result**: Session tracking works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4

#### Test Case ANA-USER-003: Custom Dimensions
- **ID**: ANA-USER-003
- **Description**: Verify custom dimensions are tracked
- **Test Steps**:
  1. Check custom dimensions configuration
  2. Trigger events with custom dimension data
  3. Verify custom dimensions are recorded in GA4
  4. Check custom dimension values are accurate
- **Expected Result**: Custom dimensions are tracked correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

### 7. Meta Tags Testing

#### Test Case ANA-META-001: Title Tags
- **ID**: ANA-META-001
- **Description**: Verify title tags are correct on all pages
- **Test Steps**:
  1. Check title tag on all pages
  2. Verify titles are unique per page
  3. Check titles include primary keywords
  4. Verify titles are 50-60 characters
  5. Check titles are localized (Arabic/English)
- **Expected Result**: Title tags are correct on all pages
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Screaming Frog, manual review

#### Test Case ANA-META-002: Meta Descriptions
- **ID**: ANA-META-002
- **Description**: Verify meta descriptions are correct on all pages
- **Test Steps**:
  1. Check meta description on all pages
  2. Verify descriptions are unique per page
  3. Check descriptions include primary keywords
  4. Verify descriptions are 150-160 characters
  5. Check descriptions are localized
- **Expected Result**: Meta descriptions are correct on all pages
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Screaming Frog, manual review

#### Test Case ANA-META-003: Meta Keywords
- **ID**: ANA-META-003
- **Description**: Verify meta keywords are correct (if used)
- **Test Steps**:
  1. Check meta keywords on all pages
  2. Verify keywords are relevant
  3. Check keywords are localized
- **Expected Result**: Meta keywords are correct (if used)
- **Priority**: Low
- **Status**: ⏳ Pending
- **Tools**: Screaming Frog, manual review

#### Test Case ANA-META-004: Meta Robots
- **ID**: ANA-META-004
- **Description**: Verify meta robots tags are correct
- **Test Steps**:
  1. Check meta robots on all pages
  2. Verify indexable pages have "index, follow"
  3. Check noindexed pages have "noindex"
  4. Verify admin pages are not indexed
- **Expected Result**: Meta robots tags are correct
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Screaming Frog, manual review

#### Test Case ANA-META-005: Canonical URLs
- **ID**: ANA-META-005
- **Description**: Verify canonical URLs are correct
- **Test Steps**:
  1. Check canonical tag on all pages
  2. Verify canonical URLs are absolute
  3. Check canonical URLs point to preferred version
  4. Verify no conflicting canonical tags
- **Expected Result**: Canonical URLs are correct
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Screaming Frog, manual review

#### Test Case ANA-META-006: Hreflang Tags
- **ID**: ANA-META-006
- **Description**: Verify hreflang tags are correct
- **Test Steps**:
  1. Check hreflang tags on all pages
  2. Verify hreflang links point to correct language versions
  3. Check hreflang links are bidirectional
  4. Verify hreflang uses correct language codes (ar, en)
  5. Check x-default is set
- **Expected Result**: Hreflang tags are correct
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Screaming Frog, hreflang validators

#### Test Case ANA-META-007: Viewport Meta Tag
- **ID**: ANA-META-007
- **Description**: Verify viewport meta tag is correct
- **Test Steps**:
  1. Check viewport meta tag
  2. Verify viewport is configured for mobile
  3. Check initial-scale is set to 1
- **Expected Result**: Viewport meta tag is correct
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Manual review

#### Test Case ANA-META-008: Charset Meta Tag
- **ID**: ANA-META-008
- **Description**: Verify charset meta tag is correct
- **Test Steps**:
  1. Check charset meta tag
  2. Verify charset is UTF-8
  3. Check charset is in first 1024 bytes
- **Expected Result**: Charset meta tag is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual review

### 8. Open Graph Metadata Testing

#### Test Case ANA-OG-001: Open Graph Tags
- **ID**: ANA-OG-001
- **Description**: Verify Open Graph tags are correct on all pages
- **Test Steps**:
  1. Check Open Graph tags on all pages
  2. Verify og:title, og:description, og:url, og:type
  3. Check og:image is present and correct
  4. Verify og:site_name is set
  5. Check og:locale is set correctly
- **Expected Result**: Open Graph tags are correct on all pages
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Facebook Sharing Debugger, manual review

#### Test Case ANA-OG-002: Open Graph Images
- **ID**: ANA-OG-002
- **Description**: Verify Open Graph images are correct
- **Test Steps**:
  1. Check og:image URLs
  2. Verify images are accessible (no 404)
  3. Check image dimensions (1200x630 recommended)
  4. Verify images are in supported format (JPG, PNG)
- **Expected Result**: Open Graph images are correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Facebook Sharing Debugger, manual testing

#### Test Case ANA-OG-003: Open Graph Sharing Preview
- **ID**: ANA-OG-003
- **Description**: Verify Open Graph sharing preview is correct
- **Test Steps**:
  1. Share page URL on Facebook
  2. Verify preview shows correct title, description, image
  3. Check preview looks good
  4. Share on LinkedIn
  5. Verify preview is correct
- **Expected Result**: Open Graph sharing preview is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Facebook Sharing Debugger, LinkedIn Post Inspector

### 9. Twitter Card Metadata Testing

#### Test Case ANA-TW-001: Twitter Card Tags
- **ID**: ANA-TW-001
- **Description**: Verify Twitter Card tags are correct
- **Test Steps**:
  1. Check Twitter Card tags on all pages
  2. Verify twitter:card type (summary_large_image)
  3. Check twitter:title, twitter:description
  4. Verify twitter:image is present and correct
- **Expected Result**: Twitter Card tags are correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Twitter Card Validator, manual review

#### Test Case ANA-TW-002: Twitter Card Preview
- **ID**: ANA-TW-002
- **Description**: Verify Twitter Card preview is correct
- **Test Steps**:
  1. Share page URL on Twitter
  2. Verify preview shows correct title, description, image
  3. Check preview looks good
- **Expected Result**: Twitter Card preview is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Twitter Card Validator

### 10. Structured Data Testing

#### Test Case ANA-SCHEMA-001: Organization Schema
- **ID**: ANA-SCHEMA-001
- **Description**: Verify Organization schema is correct
- **Test Steps**:
  1. Check Organization schema on all pages
  2. Verify required fields (name, url, logo)
  3. Check recommended fields (contactPoint, address, sameAs)
  4. Validate using Google Rich Results Test
- **Expected Result**: Organization schema is correct
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Google Rich Results Test, Schema Markup Validator

#### Test Case ANA-SCHEMA-002: Product Schema
- **ID**: ANA-SCHEMA-002
- **Description**: Verify Product schema is correct on product pages
- **Test Steps**:
  1. Check Product schema on product pages
  2. Verify required fields (name, image, description, offers)
  3. Check recommended fields (sku, brand, aggregateRating)
  4. Validate using Google Rich Results Test
- **Expected Result**: Product schema is correct
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Google Rich Results Test

#### Test Case ANA-SCHEMA-003: Breadcrumb Schema
- **ID**: ANA-SCHEMA-003
- **Description**: Verify Breadcrumb schema is correct
- **Test Steps**:
  1. Check Breadcrumb schema on all pages
  2. Verify breadcrumb hierarchy is correct
  3. Check positions are sequential
  4. Validate using Google Rich Results Test
- **Expected Result**: Breadcrumb schema is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Google Rich Results Test

#### Test Case ANA-SCHEMA-004: LocalBusiness Schema
- **ID**: ANA-SCHEMA-004
- **Description**: Verify LocalBusiness schema is correct (if used)
- **Test Steps**:
  1. Check LocalBusiness schema
  2. Verify required fields (name, address, telephone)
  3. Check recommended fields (openingHours, geo, priceRange)
  4. Validate using Google Rich Results Test
- **Expected Result**: LocalBusiness schema is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Google Rich Results Test

#### Test Case ANA-SCHEMA-005: Review Schema
- **ID**: ANA-SCHEMA-005
- **Description**: Verify Review schema is correct (if reviews exist)
- **Test Steps**:
  1. Check Review schema on product pages with reviews
  2. Verify AggregateRating schema
  3. Validate using Google Rich Results Test
- **Expected Result**: Review schema is correct
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Google Rich Results Test

#### Test Case ANA-SCHEMA-006: Schema Validation
- **ID**: ANA-SCHEMA-006
- **Description**: Verify all schema markup is valid
- **Test Steps**:
  1. Run all pages through Google Rich Results Test
  2. Verify no errors in schema markup
  3. Check for warnings
  4. Fix any validation issues
- **Expected Result**: All schema markup is valid
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Google Rich Results Test, Schema Markup Validator

### 11. PWA Metadata Testing

#### Test Case ANA-PWA-001: Manifest Metadata
- **ID**: ANA-PWA-001
- **Description**: Verify PWA manifest metadata is correct
- **Test Steps**:
  1. Check manifest.json
  2. Verify name, short_name, description
  3. Check theme_color, background_color
  4. Verify icons are configured
  5. Validate manifest using Lighthouse
- **Expected Result**: PWA manifest metadata is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Lighthouse, PWABuilder

#### Test Case ANA-PWA-002: Theme Color
- **ID**: ANA-PWA-002
- **Description**: Verify theme color metadata is correct
- **Test Steps**:
  1. Check theme-color meta tag
  2. Verify theme color matches brand
  3. Check theme color is applied on mobile
- **Expected Result**: Theme color metadata is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual review, real devices

#### Test Case ANA-PWA-003: App Icons
- **ID**: ANA-PWA-003
- **Description**: Verify app icons metadata is correct
- **Test Steps**:
  1. Check apple-touch-icon
  2. Verify favicon configuration
  3. Check manifest icons
  4. Verify all icon sizes are present
- **Expected Result**: App icons metadata is correct
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual review, real devices

### 12. Campaign Tracking Testing

#### Test Case ANA-CAMP-001: UTM Parameters
- **ID**: ANA-CAMP-001
- **Description**: Verify UTM parameters are tracked correctly
- **Test Steps**:
  1. Visit site with UTM parameters
  2. Verify UTM parameters are recorded in analytics
  3. Check source, medium, campaign are tracked
  4. Verify UTM parameters persist across pages
- **Expected Result**: UTM parameters are tracked correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-CAMP-002: Campaign Attribution
- **ID**: ANA-CAMP-002
- **Description**: Verify campaign attribution works correctly
- **Test Steps**:
  1. Visit site with different UTM parameters
  2. Complete a conversion
  3. Verify conversion is attributed to correct campaign
  4. Check attribution model
- **Expected Result**: Campaign attribution works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4

#### Test Case ANA-CAMP-003: Google Ads Tracking (if used)
- **ID**: ANA-CAMP-003
- **Description**: Verify Google Ads conversion tracking works (if used)
- **Test Steps**:
  1. Check Google Ads conversion pixel
  2. Complete a conversion
  3. Verify conversion is recorded in Google Ads
  4. Check conversion value is tracked
- **Expected Result**: Google Ads tracking works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Google Ads, Google Tag Assistant

#### Test Case ANA-CAMP-004: Facebook Pixel Tracking (if used)
- **ID**: ANA-CAMP-004
- **Description**: Verify Facebook Pixel tracking works (if used)
- **Test Steps**:
  1. Check Facebook Pixel is installed
  2. Verify PageView event is tracked
  3. Check custom events (AddToCart, Purchase)
  4. Verify events appear in Facebook Events Manager
- **Expected Result**: Facebook Pixel tracking works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Facebook Events Manager

### 13. Privacy & Compliance Testing

#### Test Case ANA-PRIV-001: Cookie Consent
- **ID**: ANA-PRIV-001
- **Description**: Verify cookie consent is implemented
- **Test Steps**:
  1. Load site in fresh browser
  2. Verify cookie consent banner appears
  3. Accept cookies
  4. Verify analytics cookies are set
  5. Reject cookies
  6. Verify analytics cookies are not set
- **Expected Result**: Cookie consent is implemented correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Manual testing, cookie checkers

#### Test Case ANA-PRIV-002: GDPR Compliance
- **ID**: ANA-PRIV-002
- **Description**: Verify GDPR compliance for analytics
- **Test Steps**:
  1. Check privacy policy includes analytics disclosure
  2. Verify user consent is required for tracking
  3. Check data retention settings
  4. Verify data anonymization (IP anonymization)
- **Expected Result**: GDPR compliance is maintained
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Manual review

#### Test Case ANA-PRIV-003: Data Privacy
- **ID**: ANA-PRIV-003
- **Description**: Verify data privacy is maintained
- **Test Steps**:
  1. Check no PII is sent to analytics
  2. Verify user IDs are anonymized
  3. Check no sensitive data in URLs
  4. Verify data is encrypted in transit
- **Expected Result**: Data privacy is maintained
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Chrome DevTools, manual review

#### Test Case ANA-PRIV-004: Do Not Track
- **ID**: ANA-PRIV-004
- **Description**: Verify Do Not Track is respected
- **Test Steps**:
  1. Enable Do Not Track in browser
  2. Visit site
  3. Verify analytics tracking is disabled or anonymized
- **Expected Result**: Do Not Track is respected
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Manual testing

### 14. Data Accuracy Testing

#### Test Case ANA-DATA-001: Data Accuracy
- **ID**: ANA-DATA-001
- **Description**: Verify analytics data is accurate
- **Test Steps**:
  1. Perform known actions (page views, events)
  2. Compare analytics data with actual actions
  3. Verify data matches expectations
  4. Check for data discrepancies
- **Expected Result**: Analytics data is accurate
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, manual testing

#### Test Case ANA-DATA-002: Data Completeness
- **ID**: ANA-DATA-002
- **Description**: Verify analytics data is complete
- **Test Steps**:
  1. Check all pages have analytics tracking
  2. Verify all key events are tracked
  3. Check for missing data
  4. Verify data completeness across sessions
- **Expected Result**: Analytics data is complete
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4

#### Test Case ANA-DATA-003: Data Consistency
- **ID**: ANA-DATA-003
- **Description**: Verify analytics data is consistent
- **Test Steps**:
  1. Compare data across different reports
  2. Verify data consistency between GA4 and other tools
  3. Check for data discrepancies
  4. Verify data is consistent over time
- **Expected Result**: Analytics data is consistent
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Google Search Console

#### Test Case ANA-DATA-004: Duplicate Event Prevention
- **ID**: ANA-DATA-004
- **Description**: Verify duplicate events are prevented
- **Test Steps**:
  1. Perform actions that trigger events
  2. Check for duplicate event firing
  3. Verify no duplicate page views
  4. Check for duplicate conversion events
- **Expected Result**: Duplicate events are prevented
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

### 15. Analytics Performance Testing

#### Test Case ANA-PERF-001: Analytics Script Performance
- **ID**: ANA-PERF-001
- **Description**: Verify analytics scripts don't impact performance
- **Test Steps**:
  1. Measure page load with analytics
  2. Measure page load without analytics
  3. Compare performance
  4. Verify analytics impact is minimal (< 5% slowdown)
- **Expected Result**: Analytics scripts have minimal performance impact
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Lighthouse, WebPageTest

#### Test Case ANA-PERF-002: Analytics Script Loading
- **ID**: ANA-PERF-002
- **Description**: Verify analytics scripts load efficiently
- **Test Steps**:
  1. Check analytics script loading
  2. Verify scripts are loaded asynchronously
  3. Check scripts are cached
  4. Verify scripts don't block rendering
- **Expected Result**: Analytics scripts load efficiently
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Chrome DevTools, Lighthouse

#### Test Case ANA-PERF-003: Analytics Data Transfer
- **ID**: ANA-PERF-003
- **Description**: Verify analytics data transfer is efficient
- **Test Steps**:
  1. Monitor analytics data transfer
  2. Check request sizes are reasonable
  3. Verify batch requests are used
  4. Check data transfer frequency
- **Expected Result**: Analytics data transfer is efficient
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Chrome DevTools, Charles Proxy

### 16. Cross-Platform Analytics Testing

#### Test Case ANA-PLAT-001: Desktop Analytics
- **ID**: ANA-PLAT-001
- **Description**: Verify analytics work on desktop
- **Test Steps**:
  1. Navigate site on desktop
  2. Verify analytics events are tracked
  3. Check device category is recorded correctly
- **Expected Result**: Analytics work on desktop
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome DevTools

#### Test Case ANA-PLAT-002: Mobile Analytics
- **ID**: ANA-PLAT-002
- **Description**: Verify analytics work on mobile
- **Test Steps**:
  1. Navigate site on mobile
  2. Verify analytics events are tracked
  3. Check device category is recorded correctly
  4. Verify mobile-specific events (if any)
- **Expected Result**: Analytics work on mobile
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, real devices

#### Test Case ANA-PLAT-003: Tablet Analytics
- **ID**: ANA-PLAT-003
- **Description**: Verify analytics work on tablet
- **Test Steps**:
  1. Navigate site on tablet
  2. Verify analytics events are tracked
  3. Check device category is recorded correctly
- **Expected Result**: Analytics work on tablet
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, real devices

### 17. Cross-Browser Analytics Testing

#### Test Case ANA-BROW-001: Chrome Analytics
- **ID**: ANA-BROW-001
- **Description**: Verify analytics work on Chrome
- **Test Steps**:
  1. Navigate site on Chrome
  2. Verify analytics events are tracked
  3. Check browser is recorded correctly
- **Expected Result**: Analytics work on Chrome
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Chrome

#### Test Case ANA-BROW-002: Firefox Analytics
- **ID**: ANA-BROW-002
- **Description**: Verify analytics work on Firefox
- **Test Steps**:
  1. Navigate site on Firefox
  2. Verify analytics events are tracked
  3. Check browser is recorded correctly
- **Expected Result**: Analytics work on Firefox
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Firefox

#### Test Case ANA-BROW-003: Safari Analytics
- **ID**: ANA-BROW-003
- **Description**: Verify analytics work on Safari (including ITP)
- **Test Steps**:
  1. Navigate site on Safari
  2. Verify analytics events are tracked
  3. Check Intelligent Tracking Prevention impact
  4. Verify data is still collected
- **Expected Result**: Analytics work on Safari
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: GA4, Safari

#### Test Case ANA-BROW-004: Edge Analytics
- **ID**: ANA-BROW-004
- **Description**: Verify analytics work on Edge
- **Test Steps**:
  1. Navigate site on Edge
  2. Verify analytics events are tracked
  3. Check browser is recorded correctly
- **Expected Result**: Analytics work on Edge
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: GA4, Edge

---

## 📊 Test Results

### Summary
| Category | Total | Passed | Failed | Pending | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Analytics Implementation | 6 | 0 | 0 | 6 | 0% |
| Page View Tracking | 4 | 0 | 0 | 4 | 0% |
| E-commerce Events | 9 | 0 | 0 | 9 | 0% |
| Custom Events | 10 | 0 | 0 | 10 | 0% |
| Conversion Tracking | 3 | 0 | 0 | 3 | 0% |
| User Tracking | 3 | 0 | 0 | 3 | 0% |
| Meta Tags | 8 | 0 | 0 | 8 | 0% |
| Open Graph | 3 | 0 | 0 | 3 | 0% |
| Twitter Cards | 2 | 0 | 0 | 2 | 0% |
| Structured Data | 6 | 0 | 0 | 6 | 0% |
| PWA Metadata | 3 | 0 | 0 | 3 | 0% |
| Campaign Tracking | 4 | 0 | 0 | 4 | 0% |
| Privacy & Compliance | 4 | 0 | 0 | 4 | 0% |
| Data Accuracy | 4 | 0 | 0 | 4 | 0% |
| Analytics Performance | 3 | 0 | 0 | 3 | 0% |
| Cross-Platform | 3 | 0 | 0 | 3 | 0% |
| Cross-Browser | 4 | 0 | 0 | 4 | 0% |
| **Total** | **79** | **0** | **0** | **79** | **0%** |

### Analytics & Metadata Coverage
| Aspect | Test Cases | Status |
|--------|------------|--------|
| Analytics Implementation | 6 | ⏳ Pending |
| Page View Tracking | 4 | ⏳ Pending |
| E-commerce Events | 9 | ⏳ Pending |
| Custom Events | 10 | ⏳ Pending |
| Conversion Tracking | 3 | ⏳ Pending |
| User Tracking | 3 | ⏳ Pending |
| Meta Tags | 8 | ⏳ Pending |
| Open Graph | 3 | ⏳ Pending |
| Twitter Cards | 2 | ⏳ Pending |
| Structured Data | 6 | ⏳ Pending |
| PWA Metadata | 3 | ⏳ Pending |
| Campaign Tracking | 4 | ⏳ Pending |
| Privacy & Compliance | 4 | ⏳ Pending |
| Data Accuracy | 4 | ⏳ Pending |
| Analytics Performance | 3 | ⏳ Pending |
| Cross-Platform | 3 | ⏳ Pending |
| Cross-Browser | 4 | ⏳ Pending |

### Detailed Results
*All test cases are currently pending execution. This report will be updated as tests are executed.*

---

## ⚠️ Issues Found

### Critical Issues
*No critical issues found yet - tests pending*

### High Priority Issues
*No high priority issues found yet - tests pending*

### Medium Priority Issues
*No medium priority issues found yet - tests pending*

### Low Priority Issues
*No low priority issues found yet - tests pending*

---

## 💡 Recommendations

### Immediate Actions (0-1 week)
1. **Verify GA4 installation** - Ensure GA4 is installed and collecting data
2. **Audit metadata** - Check all meta tags on all pages
3. **Validate structured data** - Run all pages through Google Rich Results Test
4. **Test e-commerce events** - Verify all e-commerce events fire correctly
5. **Check privacy compliance** - Verify cookie consent and GDPR compliance

### Short-term Improvements (1-4 weeks)
1. **Implement comprehensive e-commerce tracking** - All GA4 e-commerce events
2. **Add custom event tracking** - Track key user interactions
3. **Optimize metadata** - Unique titles and descriptions for all pages
4. **Implement structured data** - Organization, Product, Breadcrumb schemas
5. **Add campaign tracking** - UTM parameters for all marketing campaigns
6. **Implement conversion tracking** - Key conversions (purchase, sign_up, contact)
7. **Add custom dimensions** - Track business-specific data
8. **Implement consent management** - Cookie consent banner
9. **Optimize analytics performance** - Load analytics asynchronously
10. **Add data validation** - Ensure analytics data accuracy

### Medium-term Improvements (1-3 months)
1. **Implement advanced e-commerce tracking** - Full funnel tracking
2. **Add enhanced measurement** - Scroll tracking, outbound clicks, site search
3. **Implement attribution modeling** - Multi-touch attribution
4. **Add custom metrics** - Business-specific metrics
5. **Implement audience segmentation** - User segments for targeting
6. **Add remarketing tags** - For advertising campaigns
7. **Implement server-side tracking** - For more accurate data
8. **Add data visualization** - Custom dashboards

### Long-term Improvements (3-6 months)
1. **Implement AI-powered analytics** - Predictive analytics
2. **Add real-time analytics** - Real-time user behavior tracking
3. **Implement cross-platform analytics** - Unified view across platforms
4. **Add privacy-preserving analytics** - Cookieless tracking
5. **Implement automated reporting** - Automated analytics reports

### Specific Recommendations for NPF Storefront
1. **Track all e-commerce events** - view_item, add_to_cart, begin_checkout, purchase
2. **Implement Arabic/English tracking** - Track locale in all events
3. **Add product category tracking** - Track product categories in events
4. **Implement search tracking** - Track search queries and results
5. **Add conversion goals** - Purchase, sign_up, contact_form_submit
6. **Implement structured data** - Product schema with pricing in EGP
7. **Optimize Arabic metadata** - Arabic titles and descriptions
8. **Add Open Graph images** - Product images for social sharing
9. **Implement UTM tracking** - For all marketing campaigns
10. **Add cookie consent** - GDPR-compliant cookie consent

---

## 🎯 Conclusion

This Analytics & Metadata Testing Report outlines a comprehensive testing strategy for ensuring analytics tracking and metadata in the NPF Storefront application are accurate, complete, and optimized. With **79 detailed test cases** covering analytics implementation, page view tracking, e-commerce events, custom events, conversion tracking, user tracking, meta tags, Open Graph, Twitter Cards, structured data, PWA metadata, campaign tracking, privacy & compliance, data accuracy, analytics performance, cross-platform, and cross-browser analytics, this report provides a solid foundation for analytics and metadata validation.

### Key Findings
- **Total Test Cases**: 79
- **Categories Covered**: 17
- **Current Status**: All tests pending execution
- **Coverage**: All major analytics and metadata aspects covered

### Next Steps
1. Verify GA4 installation and data collection
2. Audit all metadata across all pages
3. Validate structured data using Google Rich Results Test
4. Test all e-commerce and custom events
5. Verify privacy compliance
6. Fix any issues found
7. Regularly audit analytics and metadata

### Sign-off
| Role | Name | Date | Signature |
|------|------|------|-----------|
| Marketing Manager | [Your Name] | [Date] | [Signature] |
| SEO Specialist | [Your Name] | [Date] | [Signature] |
| Frontend Developer | [Your Name] | [Date] | [Signature] |
| Data Analyst | [Your Name] | [Date] | [Signature] |
| Product Manager | [Your Name] | [Date] | [Signature] |

---

## 📅 Testing Timeline

| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
| Test Case Design | 2026-09-21 | 2026-09-25 | In Progress |
| Analytics Implementation Testing | 2026-09-25 | 2026-09-26 | Pending |
| Event Tracking Testing | 2026-09-26 | 2026-09-27 | Pending |
| Meta Tags Testing | 2026-09-27 | 2026-09-27 | Pending |
| Social Metadata Testing | 2026-09-27 | 2026-09-28 | Pending |
| Structured Data Testing | 2026-09-28 | 2026-09-28 | Pending |
| Privacy & Compliance Testing | 2026-09-28 | 2026-09-29 | Pending |
| Data Accuracy Testing | 2026-09-29 | 2026-09-29 | Pending |
| Issue Fixing | 2026-09-29 | 2026-10-01 | Pending |
| Final Report | 2026-10-01 | 2026-10-02 | Pending |

---

## 📚 Appendices

### Appendix A: Analytics Configuration
- GA4 property configuration
- Google Tag Manager setup
- Custom dimensions and metrics
- Conversion goals setup

### Appendix B: Metadata Templates
- Title tag templates
- Meta description templates
- Open Graph templates
- Twitter Card templates
- Structured data templates

### Appendix C: Analytics Test Setup
- GA4 debug mode setup
- Google Tag Assistant setup
- Event tracking verification

### Appendix D: Analytics Best Practices
- GA4 implementation best practices
- E-commerce tracking best practices
- Metadata best practices
- Structured data best practices
- Privacy compliance best practices

### Appendix E: Analytics Checklist
- Pre-launch analytics checklist
- Analytics verification checklist
- Metadata audit checklist
- Privacy compliance checklist

### Appendix F: Analytics Resources
- Google Analytics 4 Documentation
- Google Tag Manager Documentation
- Google Search Console Documentation
- Schema.org Documentation
- Open Graph Protocol
- Twitter Cards Documentation
- GDPR Compliance Guide

---

*Report generated on: 2026-09-21*
*Report version: 1.0*
*Next review date: 2026-09-28*
