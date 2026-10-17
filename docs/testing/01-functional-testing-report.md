# NPF Storefront - Functional Testing Report

## 📋 Table of Contents
1. [Introduction](#-introduction)
2. [Test Environment](#-test-environment)
3. [Test Scope](#-test-scope)
4. [Methodology](#-methodology)
5. [Detailed Test Cases](#-detailed-test-cases)
6. [Test Results](#-test-results)
7. [Issues Found](#-issues-found)
8. [Recommendations](#-recommendations)
9. [Conclusion](#-conclusion)

---

## 📌 Introduction

### Purpose
This document provides a comprehensive functional testing report for the NPF (Nile Pharma Food) Storefront application. Functional testing verifies that each function of the software application operates in conformance with the requirement specifications.

### Scope
This report covers all functional aspects of the NPF Storefront including:
- Core application functionality
- Server actions and API endpoints
- Data flow between components
- Business logic implementation
- Integration between frontend and backend services

### Audience
- Development Team
- QA Engineers
- Project Managers
- Stakeholders

---

## 🏗️ Test Environment

### Hardware Specifications
| Component | Details |
|-----------|---------|
| CPU | Intel i7-12700H / AMD Ryzen 9 6900HX |
| RAM | 16GB DDR4 |
| Storage | 512GB NVMe SSD |
| Display | 1920x1080, 2560x1440 |

### Software Specifications
| Component | Version |
|-----------|---------|
| Operating System | Ubuntu 22.04 LTS / macOS Ventura 13.5+ / Windows 11 |
| Node.js | 22+ |
| npm | 10+ |
| Next.js | 16.3.3 |
| React | 19.2.8 |
| Payload CMS | 3.88.0 |
| Vendure | 3.7.3 |
| PostgreSQL | 15+ |
| Browser | Chromium 120+ |

### Test Tools
| Tool | Version | Purpose |
|------|---------|---------|
| Playwright | 1.63.0 | End-to-end testing |
| Vitest | 5.0.1 | Unit testing |
| ESLint | 9+ | Code quality |
| TypeScript | 5+ | Type checking |

---

## 🎯 Test Scope

### In Scope
✅ All user-facing features and pages
✅ Server actions (cart, auth, wishlist, contact)
✅ API endpoints (Payload CMS, Vendure integration)
✅ Data validation and business logic
✅ Multi-language support (Arabic/English)
✅ PWA functionality
✅ Error handling and fallback mechanisms
✅ Form submissions and validations
✅ Navigation and routing
✅ Authentication flows
✅ Commerce functionality (cart, checkout, orders)

### Out of Scope
❌ Performance optimization (covered in separate report)
❌ Security vulnerabilities (covered in separate report)
❌ Visual design consistency (covered in UI/UX report)
❌ Cross-browser compatibility (covered in separate report)
❌ Accessibility compliance (covered in separate report)

---

## 🔧 Methodology

### Testing Approach
1. **Unit Testing**: Testing individual functions and components in isolation
2. **Integration Testing**: Testing interaction between different modules
3. **End-to-End Testing**: Testing complete user journeys
4. **Regression Testing**: Ensuring new changes don't break existing functionality

### Test Levels
- **Component Level**: Individual React components
- **Page Level**: Complete pages and their interactions
- **API Level**: Backend endpoints and server actions
- **System Level**: Complete application workflows

### Testing Techniques
- **Positive Testing**: Valid inputs and expected behaviors
- **Negative Testing**: Invalid inputs and error handling
- **Boundary Testing**: Edge cases and limit conditions
- **Equivalence Partitioning**: Grouping similar test cases
- **State Transition Testing**: Testing different application states

---

## 📝 Detailed Test Cases

### 1. Homepage Functionality

#### Test Case 1.1: Homepage Load
- **ID**: FT-HP-001
- **Description**: Verify homepage loads correctly with all elements
- **Precondition**: Application is running, database is seeded
- **Test Steps**:
  1. Navigate to `/ar` (Arabic homepage)
  2. Navigate to `/en` (English homepage)
  3. Verify page title is correct
  4. Verify meta tags are present
  5. Verify header, footer, and navigation are visible
  6. Verify hero section renders correctly
  7. Verify featured products section displays
  8. Verify category showcase renders
- **Expected Result**: All elements load without errors, content is appropriate for locale
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 1.2: Hero Section Interaction
- **ID**: FT-HP-002
- **Description**: Verify hero section buttons and links work
- **Precondition**: Homepage is loaded
- **Test Steps**:
  1. Click on primary CTA button in hero section
  2. Click on secondary CTA button (if exists)
  3. Verify navigation to correct pages
  4. Test hero carousel navigation (if applicable)
- **Expected Result**: All buttons navigate to correct destinations
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 1.3: Featured Products Display
- **ID**: FT-HP-003
- **Description**: Verify featured products display correctly
- **Precondition**: Homepage is loaded, products exist in database
- **Test Steps**:
  1. Verify featured products section is visible
  2. Verify product cards display with images, names, prices
  3. Click on a product card
  4. Verify navigation to product detail page
  5. Test "View All" or similar button
- **Expected Result**: Products display correctly, navigation works
- **Priority**: High
- **Status**: ⏳ Pending

### 2. Product Functionality

#### Test Case 2.1: Product Listing Page
- **ID**: FT-PL-001
- **Description**: Verify product listing page works correctly
- **Precondition**: Products exist in database
- **Test Steps**:
  1. Navigate to `/ar/products`
  2. Navigate to `/en/products`
  3. Verify all products are displayed
  4. Verify pagination works (if applicable)
  5. Verify filtering options (categories, search)
  6. Verify sorting options (price, name, etc.)
- **Expected Result**: All products display, filtering and sorting work correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 2.2: Product Detail Page
- **ID**: FT-PL-002
- **Description**: Verify product detail page displays all information
- **Precondition**: Products exist in database
- **Test Steps**:
  1. Navigate to a product detail page (e.g., `/ar/products/proxeed-plus`)
  2. Verify product image displays
  3. Verify product name, description, price
  4. Verify SKU and availability status
  5. Verify "Add to Cart" button is visible and functional
  6. Verify "Add to Wishlist" button works
  7. Verify related products section (if exists)
- **Expected Result**: All product information displays correctly, buttons work
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 2.3: Product Search
- **ID**: FT-PL-003
- **Description**: Verify product search functionality
- **Precondition**: Products exist in database
- **Test Steps**:
  1. Use search bar to search for a product
  2. Verify search results display matching products
  3. Test partial name search
  4. Test search with no results
  5. Test search with special characters
- **Expected Result**: Search returns correct results, handles edge cases
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 2.4: Category Filtering
- **ID**: FT-PL-004
- **Description**: Verify category filtering works
- **Precondition**: Products with different categories exist
- **Test Steps**:
  1. Click on a category in the navigation
  2. Verify only products in that category display
  3. Test multiple category filters
  4. Test category breadcrumbs
- **Expected Result**: Filtering works correctly, breadcrumbs are accurate
- **Priority**: High
- **Status**: ⏳ Pending

### 3. Cart Functionality

#### Test Case 3.1: Add to Cart
- **ID**: FT-CART-001
- **Description**: Verify adding products to cart
- **Precondition**: Products exist, user not authenticated
- **Test Steps**:
  1. Navigate to a product page
  2. Click "Add to Cart" button
  3. Verify cart indicator updates
  4. Verify product appears in cart dropdown
  5. Verify cart persists across page navigation
- **Expected Result**: Product added to cart, UI updates correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 3.2: View Cart Page
- **ID**: FT-CART-002
- **Description**: Verify cart page displays correctly
- **Precondition**: Items in cart
- **Test Steps**:
  1. Navigate to `/ar/cart`
  2. Verify all cart items display
  3. Verify item details (image, name, price, quantity)
  4. Verify subtotal, tax, total calculations
  5. Verify "Update" button works
  6. Verify "Remove" button works for each item
  7. Verify "Continue Shopping" button
  8. Verify "Proceed to Checkout" button
- **Expected Result**: Cart displays correctly, all buttons work
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 3.3: Update Cart Item Quantity
- **ID**: FT-CART-003
- **Description**: Verify updating item quantity in cart
- **Precondition**: Items in cart
- **Test Steps**:
  1. On cart page, increase quantity of an item
  2. Verify total price updates
  3. Decrease quantity of an item
  4. Verify total price updates
  5. Set quantity to minimum (1)
  6. Try to set quantity to 0 (should remove or show error)
  7. Try to set quantity above stock (should show error)
- **Expected Result**: Quantity updates correctly, errors handled properly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 3.4: Remove from Cart
- **ID**: FT-CART-004
- **Description**: Verify removing items from cart
- **Precondition**: Multiple items in cart
- **Test Steps**:
  1. Click "Remove" button on a cart item
  2. Verify item is removed from cart
  3. Verify total updates
  4. Remove all items
  5. Verify empty cart message displays
- **Expected Result**: Items removed correctly, empty state handled
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 3.5: Cart Persistence
- **ID**: FT-CART-005
- **Description**: Verify cart persists across sessions
- **Precondition**: Items in cart
- **Test Steps**:
  1. Add items to cart
  2. Refresh the page
  3. Verify items still in cart
  4. Close and reopen browser
  5. Verify items still in cart (if using localStorage)
  6. Test on different devices/browsers (should not persist)
- **Expected Result**: Cart persists as expected based on implementation
- **Priority**: High
- **Status**: ⏳ Pending

### 4. Checkout Functionality

#### Test Case 4.1: Checkout Page Access
- **ID**: FT-CK-001
- **Description**: Verify checkout page access
- **Precondition**: Items in cart
- **Test Steps**:
  1. Navigate to `/ar/checkout` with items in cart
  2. Verify page loads correctly
  3. Verify all checkout steps are visible
  4. Try to access checkout with empty cart
  5. Verify redirect or error message
- **Expected Result**: Checkout accessible with items, blocked without
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 4.2: Checkout Form - Shipping Information
- **ID**: FT-CK-002
- **Description**: Verify shipping information form
- **Precondition**: On checkout page
- **Test Steps**:
  1. Fill in all required shipping fields
  2. Verify form validation works
  3. Try to submit with missing required fields
  4. Verify error messages display
  5. Fill in all fields correctly
  6. Proceed to next step
- **Expected Result**: Form validates correctly, navigation to next step works
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 4.3: Checkout Form - Payment Information
- **ID**: FT-CK-003
- **Description**: Verify payment information form
- **Precondition**: Shipping information completed
- **Test Steps**:
  1. Select a payment method
  2. Fill in payment details
  3. Verify form validation
  4. Try invalid payment details
  5. Verify error handling
- **Expected Result**: Payment form works correctly, errors handled
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 4.4: Order Review
- **ID**: FT-CK-004
- **Description**: Verify order review step
- **Precondition**: Shipping and payment information completed
- **Test Steps**:
  1. Verify order summary displays all items
  2. Verify prices are correct
  3. Verify shipping address displays
  4. Verify payment method displays
  5. Verify "Place Order" button
- **Expected Result**: Order review displays all information correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 4.5: Place Order
- **ID**: FT-CK-005
- **Description**: Verify placing an order
- **Precondition**: All checkout steps completed
- **Test Steps**:
  1. Click "Place Order" button
  2. Verify loading state
  3. Verify order confirmation page loads
  4. Verify order details display
  5. Verify order confirmation email is sent (if configured)
  6. Verify cart is emptied
- **Expected Result**: Order placed successfully, confirmation displayed
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 4.6: Order Confirmation Page
- **ID**: FT-CK-006
- **Description**: Verify order confirmation page
- **Precondition**: Order has been placed
- **Test Steps**:
  1. Navigate to `/ar/checkout/confirmation?orderCode=XXX`
  2. Verify order details display
  3. Verify order number, date, items
  4. Verify total amount
  5. Verify shipping address
  6. Verify "Continue Shopping" button
- **Expected Result**: Order confirmation displays all information
- **Priority**: High
- **Status**: ⏳ Pending

### 5. Authentication Functionality

#### Test Case 5.1: Login Page
- **ID**: FT-AUTH-001
- **Description**: Verify login page and functionality
- **Precondition**: User account exists
- **Test Steps**:
  1. Navigate to `/ar/login`
  2. Verify login form displays
  3. Enter valid email and password
  4. Click "Login" button
  5. Verify redirect to appropriate page
  6. Verify user is authenticated
- **Expected Result**: Login works correctly, user authenticated
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 5.2: Login with Invalid Credentials
- **ID**: FT-AUTH-002
- **Description**: Verify error handling for invalid login
- **Precondition**: On login page
- **Test Steps**:
  1. Enter invalid email
  2. Enter invalid password
  3. Click "Login" button
  4. Verify error message displays
  5. Verify user remains unauthenticated
- **Expected Result**: Error displayed, user not authenticated
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 5.3: Registration Page
- **ID**: FT-AUTH-003
- **Description**: Verify user registration
- **Precondition**: On registration page
- **Test Steps**:
  1. Navigate to `/ar/register`
  2. Fill in all required fields
  3. Click "Register" button
  4. Verify account is created
  5. Verify redirect to login or home page
  6. Verify welcome email (if configured)
- **Expected Result**: Registration works, account created
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 5.4: Registration Validation
- **ID**: FT-AUTH-004
- **Description**: Verify registration form validation
- **Precondition**: On registration page
- **Test Steps**:
  1. Try to register with missing required fields
  2. Verify error messages
  3. Try to register with invalid email format
  4. Verify error message
  5. Try to register with weak password
  6. Verify error message
  7. Try to register with existing email
  8. Verify error message
- **Expected Result**: All validations work correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 5.5: Logout Functionality
- **ID**: FT-AUTH-005
- **Description**: Verify logout works correctly
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Click "Logout" button in header
  2. Verify user is logged out
  3. Verify redirect to home page
  4. Verify session is cleared
- **Expected Result**: User logged out, session cleared
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 5.6: Password Reset
- **ID**: FT-AUTH-006
- **Description**: Verify password reset flow
- **Precondition**: User account exists
- **Test Steps**:
  1. Navigate to password reset page (if exists)
  2. Enter email address
  3. Verify reset link is sent (check logs or email)
  4. Click reset link
  5. Verify password reset page loads
  6. Enter new password
  7. Verify password is updated
  8. Verify login with new password works
- **Expected Result**: Password reset works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

### 6. Account Functionality

#### Test Case 6.1: Account Dashboard
- **ID**: FT-ACC-001
- **Description**: Verify account dashboard page
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Navigate to `/ar/account`
  2. Verify dashboard displays
  3. Verify user information displays
  4. Verify order history section
  5. Verify navigation links to account sub-pages
- **Expected Result**: Dashboard displays correctly with user info
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 6.2: Profile Management
- **ID**: FT-ACC-002
- **Description**: Verify profile update functionality
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Navigate to `/ar/account/profile`
  2. Update profile information
  3. Click "Save" button
  4. Verify changes are saved
  5. Verify updated information displays
- **Expected Result**: Profile updates correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 6.3: Order History
- **ID**: FT-ACC-003
- **Description**: Verify order history display
- **Precondition**: User has placed orders
- **Test Steps**:
  1. Navigate to `/ar/account/orders`
  2. Verify all orders display
  3. Verify order details (date, amount, status)
  4. Click on an order
  5. Verify order details page loads
- **Expected Result**: Order history displays correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 6.4: Order Details
- **ID**: FT-ACC-004
- **Description**: Verify order details page
- **Precondition**: User has placed orders
- **Test Steps**:
  1. Navigate to `/ar/account/orders/[code]`
  2. Verify order items display
  3. Verify order status
  4. Verify shipping information
  5. Verify payment information
- **Expected Result**: Order details display correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 6.5: Address Management
- **ID**: FT-ACC-005
- **Description**: Verify address management
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Navigate to `/ar/account/addresses`
  2. Verify existing addresses display
  3. Click "Add New Address"
  4. Fill in address form
  5. Save address
  6. Verify address appears in list
  7. Edit an address
  8. Delete an address
- **Expected Result**: Address management works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 6.6: Wishlist Management
- **ID**: FT-ACC-006
- **Description**: Verify wishlist functionality
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Navigate to `/ar/account/wishlist` or `/ar/wishlist`
  2. Verify wishlist items display
  3. Click "Add to Cart" on a wishlist item
  4. Verify item added to cart
  5. Click "Remove" on a wishlist item
  6. Verify item removed from wishlist
- **Expected Result**: Wishlist management works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

### 7. Contact Functionality

#### Test Case 7.1: Contact Page
- **ID**: FT-CONT-001
- **Description**: Verify contact page displays correctly
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/contact`
  2. Verify contact form displays
  3. Verify company information displays
  4. Verify map displays (if applicable)
- **Expected Result**: Contact page displays correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 7.2: Contact Form Submission
- **ID**: FT-CONT-002
- **Description**: Verify contact form submission
- **Precondition**: On contact page
- **Test Steps**:
  1. Fill in all required fields
  2. Click "Submit" button
  3. Verify form submission success message
  4. Verify inquiry is stored in Payload CMS
  5. Verify email notification (if configured)
- **Expected Result**: Form submits correctly, data stored
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 7.3: Contact Form Validation
- **ID**: FT-CONT-003
- **Description**: Verify contact form validation
- **Precondition**: On contact page
- **Test Steps**:
  1. Try to submit with missing required fields
  2. Verify error messages
  3. Try to submit with invalid email format
  4. Verify error message
  5. Try to submit with very long text
  6. Verify handling (accept or error)
- **Expected Result**: Form validates correctly
- **Priority**: High
- **Status**: ⏳ Pending

### 8. Navigation and Routing

#### Test Case 8.1: Main Navigation
- **ID**: FT-NAV-001
- **Description**: Verify main navigation menu
- **Precondition**: Application is running
- **Test Steps**:
  1. Click on each main navigation link
  2. Verify navigation to correct page
  3. Verify active link highlighting
  4. Test hover states
- **Expected Result**: All navigation links work correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 8.2: Language Switching
- **ID**: FT-NAV-002
- **Description**: Verify language switching
- **Precondition**: Application is running
- **Test Steps**:
  1. Click on language switcher
  2. Switch from Arabic to English
  3. Verify URL changes
  4. Verify content changes to English
  5. Switch back to Arabic
  6. Verify content changes back
- **Expected Result**: Language switching works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 8.3: Mobile Navigation
- **ID**: FT-NAV-003
- **Description**: Verify mobile navigation menu
- **Precondition**: Application is running on mobile viewport
- **Test Steps**:
  1. Click on mobile menu button
  2. Verify menu opens
  3. Click on menu links
  4. Verify navigation works
  5. Click outside to close menu
  6. Verify menu closes
- **Expected Result**: Mobile navigation works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 8.4: Bottom Navigation
- **ID**: FT-NAV-004
- **Description**: Verify bottom navigation bar
- **Precondition**: Application is running on mobile viewport
- **Test Steps**:
  1. Verify bottom navigation bar is visible
  2. Click on each bottom navigation icon
  3. Verify navigation to correct page
  4. Verify active state highlighting
- **Expected Result**: Bottom navigation works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 8.5: 404 Page
- **ID**: FT-NAV-005
- **Description**: Verify 404 page handling
- **Precondition**: Application is running
- **Test Steps**:
  1. Navigate to a non-existent URL (e.g., `/ar/non-existent`)
  2. Verify 404 page displays
  3. Verify "Go Back" or "Home" button works
  4. Test 404 in both languages
- **Expected Result**: 404 page displays correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 8.6: Redirects
- **ID**: FT-NAV-006
- **Description**: Verify redirects work correctly
- **Precondition**: Application is running
- **Test Steps**:
  1. Test redirect from `/` to `/ar` or `/en`
  2. Test redirect after login
  3. Test redirect after logout
  4. Test redirect after adding to cart
- **Expected Result**: All redirects work as expected
- **Priority**: High
- **Status**: ⏳ Pending

### 9. PWA Functionality

#### Test Case 9.1: Service Worker Registration
- **ID**: FT-PWA-001
- **Description**: Verify service worker registers correctly
- **Precondition**: Application is running
- **Test Steps**:
  1. Open browser dev tools
  2. Go to Application > Service Workers
  3. Verify service worker is registered
  4. Verify service worker status is "activated"
- **Expected Result**: Service worker registers and activates
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 9.2: Manifest File
- **ID**: FT-PWA-002
- **Description**: Verify PWA manifest is correct
- **Precondition**: Application is running
- **Test Steps**:
  1. Navigate to `/manifest.webmanifest`
  2. Verify manifest file loads
  3. Verify all required fields are present
  4. Verify icons are referenced correctly
- **Expected Result**: Manifest file is valid and complete
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 9.3: Install Prompt
- **ID**: FT-PWA-003
- **Description**: Verify install prompt displays
- **Precondition**: Application is running, service worker registered
- **Test Steps**:
  1. Open application in browser
  2. Wait for install prompt to appear
  3. Verify prompt displays correctly
  4. Click "Install" button
  5. Verify application installs (in supported browsers)
- **Expected Result**: Install prompt works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 9.4: Offline Mode
- **ID**: FT-PWA-004
- **Description**: Verify offline functionality
- **Precondition**: Service worker registered, page visited
- **Test Steps**:
  1. Visit homepage
  2. Go offline (disable network)
  3. Refresh page
  4. Verify offline page displays
  5. Navigate to previously visited pages
  6. Verify pages load from cache
- **Expected Result**: Offline mode works, cached pages load
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 9.5: Offline Fallback Page
- **ID**: FT-PWA-005
- **Description**: Verify offline fallback page
- **Precondition**: Offline mode
- **Test Steps**:
  1. Navigate to `/offline`
  2. Verify offline page displays
  3. Verify "Retry" button
  4. Go online and click "Retry"
  5. Verify page reloads
- **Expected Result**: Offline fallback page works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 9.6: Cache Strategy
- **ID**: FT-PWA-006
- **Description**: Verify caching strategy works
- **Precondition**: Service worker registered
- **Test Steps**:
  1. Visit multiple pages
  2. Go offline
  3. Navigate to cached pages
  4. Verify pages load from cache
  5. Go online
  6. Verify new content loads (not stale cache)
- **Expected Result**: Caching works correctly, stale content updated
- **Priority**: Medium
- **Status**: ⏳ Pending

### 10. API and Integration Testing

#### Test Case 10.1: Payload CMS API
- **ID**: FT-API-001
- **Description**: Verify Payload CMS API endpoints
- **Precondition**: Payload CMS is running, database is seeded
- **Test Steps**:
  1. Test GET `/api/products`
  2. Verify products are returned
  3. Test GET `/api/categories`
  4. Verify categories are returned
  5. Test GET `/api/media`
  6. Verify media files are returned
- **Expected Result**: All Payload API endpoints work correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 10.2: Vendure Shop API Integration
- **ID**: FT-API-002
- **Description**: Verify Vendure integration
- **Precondition**: Vendure backend is running
- **Test Steps**:
  1. Test product pricing from Vendure
  2. Verify live pricing updates
  3. Test cart operations through Vendure
  4. Verify order creation through Vendure
  5. Test customer authentication through Vendure
- **Expected Result**: Vendure integration works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 10.3: Server Actions - Cart
- **ID**: FT-API-003
- **Description**: Verify cart server actions
- **Precondition**: Application is running
- **Test Steps**:
  1. Test `addToCart` action
  2. Verify item added to cart
  3. Test `updateCartItem` action
  4. Verify quantity updated
  5. Test `removeFromCart` action
  6. Verify item removed
  7. Test `getCart` action
  8. Verify cart data returned
- **Expected Result**: All cart server actions work correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 10.4: Server Actions - Authentication
- **ID**: FT-API-004
- **Description**: Verify auth server actions
- **Precondition**: Application is running
- **Test Steps**:
  1. Test `login` action
  2. Verify user authenticated
  3. Test `register` action
  4. Verify user created
  5. Test `logout` action
  6. Verify user logged out
  7. Test `getSession` action
  8. Verify session data returned
- **Expected Result**: All auth server actions work correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 10.5: Server Actions - Wishlist
- **ID**: FT-API-005
- **Description**: Verify wishlist server actions
- **Precondition**: User authenticated
- **Test Steps**:
  1. Test `addToWishlist` action
  2. Verify item added to wishlist
  3. Test `removeFromWishlist` action
  4. Verify item removed
  5. Test `getWishlist` action
  6. Verify wishlist data returned
- **Expected Result**: All wishlist server actions work correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 10.6: Server Actions - Contact
- **ID**: FT-API-006
- **Description**: Verify contact server actions
- **Precondition**: Application is running
- **Test Steps**:
  1. Test `submitInquiry` action
  2. Verify inquiry stored in Payload
  3. Verify form submission success
- **Expected Result**: Contact server action works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 10.7: GraphQL API
- **ID**: FT-API-007
- **Description**: Verify GraphQL API endpoint
- **Precondition**: Application is running
- **Test Steps**:
  1. Navigate to `/api/graphql`
  2. Test a GraphQL query
  3. Verify response is correct
  4. Test GraphQL Playground at `/api/graphql-playground`
  5. Verify Playground loads
- **Expected Result**: GraphQL API works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

### 11. Forms and Validation

#### Test Case 11.1: Form Input Validation
- **ID**: FT-FORM-001
- **Description**: Verify form validation across all forms
- **Precondition**: Application is running
- **Test Steps**:
  1. Test required field validation on all forms
  2. Test email format validation
  3. Test phone number validation
  4. Test password strength validation
  5. Test minimum/maximum length validation
- **Expected Result**: All form validations work correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 11.2: Form Submission
- **ID**: FT-FORM-002
- **Description**: Verify form submission works
- **Precondition**: Application is running
- **Test Steps**:
  1. Fill in a form with valid data
  2. Submit the form
  3. Verify loading state
  4. Verify success message
  5. Verify data is processed correctly
- **Expected Result**: Form submission works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 11.3: Form Error Handling
- **ID**: FT-FORM-003
- **Description**: Verify form error handling
- **Precondition**: Application is running
- **Test Steps**:
  1. Submit a form with invalid data
  2. Verify error messages display
  3. Verify error messages are user-friendly
  4. Verify form does not submit
  5. Verify user can correct errors and resubmit
- **Expected Result**: Form errors handled correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 11.4: Form Reset
- **ID**: FT-FORM-004
- **Description**: Verify form reset functionality
- **Precondition**: Form has been filled
- **Test Steps**:
  1. Fill in a form
  2. Click "Reset" or "Cancel" button
  3. Verify form fields are cleared
  4. Verify form returns to initial state
- **Expected Result**: Form reset works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

### 12. Error Handling

#### Test Case 12.1: Network Error Handling
- **ID**: FT-ERR-001
- **Description**: Verify network error handling
- **Precondition**: Application is running
- **Test Steps**:
  1. Disable network connection
  2. Try to load a page
  3. Verify error message displays
  4. Re-enable network
  5. Verify page loads correctly
- **Expected Result**: Network errors handled gracefully
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 12.2: API Error Handling
- **ID**: FT-ERR-002
- **Description**: Verify API error handling
- **Precondition**: Application is running
- **Test Steps**:
  1. Simulate API failure (e.g., Vendure down)
  2. Try to load product page
  3. Verify fallback data displays
  4. Try to add to cart
  5. Verify error message displays
- **Expected Result**: API errors handled with fallbacks
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 12.3: Database Error Handling
- **ID**: FT-ERR-003
- **Description**: Verify database error handling
- **Precondition**: Application is running
- **Test Steps**:
  1. Simulate database connection failure
  2. Try to load a page that requires database
  3. Verify error page displays
  4. Verify error is logged
- **Expected Result**: Database errors handled gracefully
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 12.4: 500 Error Page
- **ID**: FT-ERR-004
- **Description**: Verify 500 error page
- **Precondition**: Server error occurs
- **Test Steps**:
  1. Trigger a server error
  2. Verify 500 error page displays
  3. Verify error details are not exposed to user
  4. Verify "Retry" or "Go Home" button works
- **Expected Result**: 500 error page displays correctly
- **Priority**: High
- **Status**: ⏳ Pending

### 13. Static Pages

#### Test Case 13.1: About Page
- **ID**: FT-STATIC-001
- **Description**: Verify about page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/about`
  2. Verify page loads
  3. Verify content displays correctly
  4. Test in both languages
- **Expected Result**: About page works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 13.2: Careers Page
- **ID**: FT-STATIC-002
- **Description**: Verify careers page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/careers`
  2. Verify page loads
  3. Verify content displays correctly
- **Expected Result**: Careers page works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 13.3: Privacy Policy Page
- **ID**: FT-STATIC-003
- **Description**: Verify privacy policy page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/privacy-policy`
  2. Verify page loads
  3. Verify content displays correctly
- **Expected Result**: Privacy policy page works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 13.4: Terms Page
- **ID**: FT-STATIC-004
- **Description**: Verify terms page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/terms`
  2. Verify page loads
  3. Verify content displays correctly
- **Expected Result**: Terms page works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 13.5: Shipping & Delivery Page
- **ID**: FT-STATIC-005
- **Description**: Verify shipping and delivery page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/shipping-delivery`
  2. Verify page loads
  3. Verify content displays correctly
- **Expected Result**: Shipping page works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 13.6: Quality Sourcing Page
- **ID**: FT-STATIC-006
- **Description**: Verify quality sourcing page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/quality-sourcing`
  2. Verify page loads
  3. Verify content displays correctly
- **Expected Result**: Quality sourcing page works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 13.7: Story Page
- **ID**: FT-STATIC-007
- **Description**: Verify story page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/story`
  2. Verify page loads
  3. Verify content displays correctly
- **Expected Result**: Story page works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

#### Test Case 13.8: Blogs Page
- **ID**: FT-STATIC-008
- **Description**: Verify blogs page
- **Precondition**: None
- **Test Steps**:
  1. Navigate to `/ar/blogs`
  2. Verify page loads
  3. Verify empty state message (currently no blogs)
  4. Verify noindex meta tag is present
- **Expected Result**: Blogs page works correctly
- **Priority**: Low
- **Status**: ⏳ Pending

### 14. Admin Panel (Payload CMS)

#### Test Case 14.1: Admin Login
- **ID**: FT-ADMIN-001
- **Description**: Verify admin panel login
- **Precondition**: Admin user exists
- **Test Steps**:
  1. Navigate to `/admin`
  2. Enter admin credentials
  3. Verify login works
  4. Verify admin dashboard loads
- **Expected Result**: Admin login works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending

#### Test Case 14.2: Product Management
- **ID**: FT-ADMIN-002
- **Description**: Verify product CRUD operations
- **Precondition**: Admin is authenticated
- **Test Steps**:
  1. Navigate to Products collection
  2. Create a new product
  3. Verify product appears in list
  4. Edit the product
  5. Verify changes are saved
  6. Delete the product
  7. Verify product is removed
- **Expected Result**: Product CRUD works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 14.3: Category Management
- **ID**: FT-ADMIN-003
- **Description**: Verify category CRUD operations
- **Precondition**: Admin is authenticated
- **Test Steps**:
  1. Navigate to Categories collection
  2. Create a new category
  3. Edit a category
  4. Delete a category
- **Expected Result**: Category CRUD works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 14.4: Media Management
- **ID**: FT-ADMIN-004
- **Description**: Verify media upload and management
- **Precondition**: Admin is authenticated
- **Test Steps**:
  1. Navigate to Media collection
  2. Upload an image
  3. Verify image appears in list
  4. Use image in a product
  5. Verify image displays on frontend
- **Expected Result**: Media management works correctly
- **Priority**: High
- **Status**: ⏳ Pending

#### Test Case 14.5: Inquiry Management
- **ID**: FT-ADMIN-005
- **Description**: Verify inquiry viewing
- **Precondition**: Inquiries exist in database
- **Test Steps**:
  1. Navigate to Inquiries collection
  2. Verify inquiries display
  3. View an inquiry
  4. Verify all details display
- **Expected Result**: Inquiry management works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending

### 15. Lab Routes (Design Prototypes)

#### Test Case 15.1: Lab Routes Access
- **ID**: FT-LAB-001
- **Description**: Verify lab routes accessibility
- **Precondition**: ALLOW_LAB_ROUTES=true
- **Test Steps**:
  1. Navigate to `/ar/lab/hero-abstract`
  2. Verify page loads
  3. Verify design prototype displays
- **Expected Result**: Lab routes work when enabled
- **Priority**: Low
- **Status**: ⏳ Pending

#### Test Case 15.2: Lab Routes Disabled
- **ID**: FT-LAB-002
- **Description**: Verify lab routes return 404 when disabled
- **Precondition**: ALLOW_LAB_ROUTES=false or not set
- **Test Steps**:
  1. Navigate to `/ar/lab/hero-abstract`
  2. Verify 404 page displays
- **Expected Result**: Lab routes return 404 when disabled
- **Priority**: Low
- **Status**: ⏳ Pending

---

## 📊 Test Results

### Summary
| Category | Total | Passed | Failed | Pending | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Homepage | 3 | 0 | 0 | 3 | 0% |
| Products | 4 | 0 | 0 | 4 | 0% |
| Cart | 5 | 0 | 0 | 5 | 0% |
| Checkout | 6 | 0 | 0 | 6 | 0% |
| Authentication | 6 | 0 | 0 | 6 | 0% |
| Account | 6 | 0 | 0 | 6 | 0% |
| Contact | 3 | 0 | 0 | 3 | 0% |
| Navigation | 6 | 0 | 0 | 6 | 0% |
| PWA | 6 | 0 | 0 | 6 | 0% |
| API & Integration | 7 | 0 | 0 | 7 | 0% |
| Forms & Validation | 4 | 0 | 0 | 4 | 0% |
| Error Handling | 4 | 0 | 0 | 4 | 0% |
| Static Pages | 8 | 0 | 0 | 8 | 0% |
| Admin Panel | 5 | 0 | 0 | 5 | 0% |
| Lab Routes | 2 | 0 | 0 | 2 | 0% |
| **Total** | **75** | **0** | **0** | **75** | **0%** |

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

### Immediate Actions
1. **Execute all test cases** - Run the complete test suite to identify actual issues
2. **Set up CI/CD testing** - Configure automated testing in GitHub Actions
3. **Implement test coverage reporting** - Add coverage reports to identify untested code

### Short-term Improvements
1. **Expand unit test coverage** - Add more unit tests for utility functions
2. **Add integration tests** - Test interactions between different modules
3. **Implement visual regression testing** - Use tools like Percy or Chromatic
4. **Add performance tests** - Include load and stress testing

### Long-term Improvements
1. **Implement contract testing** - Test API contracts between frontend and backend
2. **Add accessibility testing** - Automated accessibility checks
3. **Implement security testing** - Automated security scans
4. **Add cross-browser testing** - Test on multiple browser engines

---

## 🎯 Conclusion

This Functional Testing Report outlines a comprehensive testing strategy for the NPF Storefront application. With **75 detailed test cases** covering all functional aspects of the application, this report provides a solid foundation for ensuring the quality and reliability of the software.

### Key Findings
- **Total Test Cases**: 75
- **Current Status**: All tests pending execution
- **Coverage**: All major functional areas covered

### Next Steps
1. Execute all test cases and document results
2. Fix any identified issues
3. Implement automated testing in CI/CD pipeline
4. Regularly update test cases as new features are added

### Sign-off
| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Engineer | [Your Name] | [Date] | [Signature] |
| Lead Developer | [Your Name] | [Date] | [Signature] |
| Project Manager | [Your Name] | [Date] | [Signature] |

---

## 📅 Testing Timeline

| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
| Test Case Design | 2026-09-21 | 2026-09-22 | In Progress |
| Test Execution | 2026-09-22 | 2026-09-25 | Pending |
| Issue Fixing | 2026-09-25 | 2026-09-28 | Pending |
| Regression Testing | 2026-09-28 | 2026-09-30 | Pending |
| Final Report | 2026-09-30 | 2026-10-01 | Pending |

---

## 📚 Appendices

### Appendix A: Test Data
- Mock product data
- Test user accounts
- Sample inquiries

### Appendix B: Test Environment Configuration
- Database setup instructions
- Vendure configuration
- Payload CMS configuration

### Appendix C: Automated Test Scripts
- Playwright test scripts
- Vitest unit tests
- Custom test utilities

---

*Report generated on: 2026-09-21*
*Report version: 1.0*
*Next review date: 2026-09-28*
