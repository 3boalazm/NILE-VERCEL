# NPF Storefront - API & Integration Testing Report

## 📋 Table of Contents
1. [Introduction](#-introduction)
2. [Test Environment](#-test-environment)
3. [Test Scope](#-test-scope)
4. [API Architecture Overview](#-api-architecture-overview)
5. [Detailed Test Cases](#-detailed-test-cases)
6. [Test Results](#-test-results)
7. [Issues Found](#-issues-found)
8. [Recommendations](#-recommendations)
9. [Conclusion](#-conclusion)

---

## 📌 Introduction

### Purpose
This document provides a comprehensive API and Integration Testing report for the NPF (Nile Pharma Food) Storefront application. API testing ensures that all application programming interfaces function correctly, reliably, and securely, while integration testing verifies that different modules and services work together as expected.

### Scope
This report covers:
- REST API testing
- GraphQL API testing
- Server Actions testing (Next.js)
- Payload CMS API testing
- Vendure Shop API integration testing
- Third-party service integrations
- API performance testing
- API security testing
- API error handling testing
- API documentation testing
- Data flow testing between services
- Integration testing between frontend and backend
- Integration testing between microservices
- End-to-end integration testing

### Audience
- Backend Developers
- Frontend Developers
- API Engineers
- QA Engineers
- DevOps Engineers
- Integration Specialists
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
| Network | 1 Gbps Fiber |

### Software Specifications
| Component | Version |
|-----------|---------|
| Operating Systems | Ubuntu 22.04 LTS, macOS Ventura 13.5+, Windows 11 |
| Node.js | 22+ |
| npm | 10+ |
| Next.js | 16.3.3 |
| React | 19.2.8 |
| Payload CMS | 3.88.0 |
| Vendure | 3.7.3 |
| PostgreSQL | 15+ |
| Browsers | Chrome 120+, Firefox 120+, Safari 17+, Edge 120+ |

### Test Tools
| Tool | Version | Purpose |
|------|---------|---------|
| Postman | Latest | API testing, automation |
| Insomnia | Latest | API testing, automation |
| Newman | Latest | Postman CLI for CI/CD |
| Supertest | Latest | HTTP assertions |
| Jest | 29+ | API unit testing |
| Vitest | 5.0.1 | API testing |
| Playwright | 1.63.0 | API integration testing |
| curl | Latest | Manual API testing |
| httpie | Latest | Manual API testing |
| Swagger UI / Redoc | Latest | API documentation testing |
| OpenAPI Validator | Latest | API specification validation |
| JSON Schema Validator | Latest | Response schema validation |
| Mock Service Worker (MSW) | Latest | API mocking |
| Nock | Latest | HTTP mocking |
| Sinon | Latest | Test spies, stubs, mocks |
| Faker | Latest | Test data generation |
| Payload CMS Admin Panel | Built-in | Payload API testing |
| Vendure Admin Panel | Built-in | Vendure API testing |

---

## 🎯 Test Scope

### In Scope
✅ All REST API endpoints
✅ All GraphQL API endpoints
✅ All Server Actions (Next.js)
✅ Payload CMS API endpoints
✅ Vendure Shop API endpoints
✅ Third-party service integrations
✅ API performance (response time, throughput)
✅ API security (authentication, authorization, input validation)
✅ API error handling
✅ API documentation
✅ Data flow between services
✅ Integration between frontend and backend
✅ Integration between Payload CMS and Next.js
✅ Integration between Vendure and Next.js
✅ Integration between different microservices
✅ End-to-end integration flows
✅ API versioning and backward compatibility
✅ API rate limiting and throttling
✅ API caching
✅ API monitoring and logging

### Out of Scope
❌ Performance testing of individual components (covered in Performance Testing Report)
❌ Security testing beyond API-specific concerns (covered in Security Testing Report)
❌ Functional testing of UI components (covered in Functional Testing Report)
❌ Accessibility testing of API endpoints (N/A)
❌ SEO testing of API endpoints (N/A)

---

## 🔌 API Architecture Overview

### API Types in NPF Storefront

#### 1. Next.js Server Actions
- **Framework**: Next.js 16 (App Router)
- **Purpose**: Server-side functions for data mutations
- **Location**: `src/lib/*/actions.ts` files
- **Transport**: HTTP POST with `Next-Action` header
- **Authentication**: Session-based (cookies)
- **Key Actions**:
  - Cart operations (add, update, remove)
  - Authentication (login, register, logout)
  - Wishlist operations
  - Contact form submission
  - Order management

#### 2. Next.js Route Handlers (API Routes)
- **Framework**: Next.js 16
- **Purpose**: RESTful API endpoints
- **Location**: `src/app/(payload)/api/[...slug]/route.ts`
- **Authentication**: Varies by endpoint
- **Key Endpoints**:
  - Payload CMS proxy
  - GraphQL Playground
  - GraphQL endpoint

#### 3. Payload CMS API
- **Framework**: Payload CMS 3
- **Purpose**: Content management (products, categories, media, inquiries)
- **Type**: REST and GraphQL
- **Base URL**: `/api` (proxied through Next.js)
- **Authentication**: JWT tokens
- **Key Collections**:
  - Products
  - Categories
  - Media
  - Users
  - Inquiries

#### 4. Vendure Shop API
- **Framework**: Vendure 3.7.3
- **Purpose**: E-commerce operations (cart, checkout, orders, customers)
- **Type**: GraphQL
- **Base URL**: Configurable via `VENDURE_SHOP_API_URL`
- **Authentication**: Session-based (cookies) for shop API
- **Key Operations**:
  - Product catalog
  - Pricing
  - Cart management
  - Checkout
  - Order management
  - Customer management

### API Integration Flow

```
User Browser
    ↓ (HTTP Request)
Next.js Frontend
    ↓ (Server Actions / API Routes)
    ├──→ Payload CMS (Products, Categories, Content)
    │       ↓ (PostgreSQL)
    │   Payload Database
    │
    └──→ Vendure Shop API (Cart, Checkout, Orders)
            ↓ (PostgreSQL)
        Vendure Database
```

### Key Integration Points
1. **Frontend ↔ Next.js Server Actions**: Cart, auth, wishlist, contact
2. **Next.js ↔ Payload CMS**: Product data, categories, media, inquiries
3. **Next.js ↔ Vendure**: Live pricing, cart, checkout, orders
4. **Payload CMS ↔ PostgreSQL**: Content storage
5. **Vendure ↔ PostgreSQL**: E-commerce data storage

---

## 📝 Detailed Test Cases

### 1. Server Actions Testing

#### Cart Server Actions

##### Test Case API-SA-CART-001: addToCart Action
- **ID**: API-SA-CART-001
- **Description**: Verify addToCart server action works correctly
- **Precondition**: User session exists, product exists in Vendure
- **Test Steps**:
  1. Call addToCart with valid product ID and quantity
  2. Verify cart is updated in Vendure
  3. Verify response contains updated cart data
  4. Check for proper error handling with invalid inputs
  5. Verify cart persistence across sessions
- **Expected Result**: Product added to cart, response contains updated cart data
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-CART-002: updateCartItem Action
- **ID**: API-SA-CART-002
- **Description**: Verify updateCartItem server action works correctly
- **Precondition**: Item exists in cart
- **Test Steps**:
  1. Call updateCartItem with valid item ID and new quantity
  2. Verify cart item quantity is updated in Vendure
  3. Verify response contains updated cart data
  4. Test with quantity = 0 (should remove item)
  5. Test with invalid quantity (should return error)
- **Expected Result**: Cart item quantity updated, response contains updated cart data
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-CART-003: removeFromCart Action
- **ID**: API-SA-CART-003
- **Description**: Verify removeFromCart server action works correctly
- **Precondition**: Item exists in cart
- **Test Steps**:
  1. Call removeFromCart with valid item ID
  2. Verify item is removed from cart in Vendure
  3. Verify response contains updated cart data
  4. Test with invalid item ID (should return error)
- **Expected Result**: Item removed from cart, response contains updated cart data
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-CART-004: getCart Action
- **ID**: API-SA-CART-004
- **Description**: Verify getCart server action works correctly
- **Precondition**: Cart may or may not have items
- **Test Steps**:
  1. Call getCart with valid session
  2. Verify response contains current cart data
  3. Verify cart items have correct details (name, price, quantity)
  4. Test with empty cart
  5. Test with invalid session
- **Expected Result**: Cart data returned correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

#### Authentication Server Actions

##### Test Case API-SA-AUTH-001: login Action
- **ID**: API-SA-AUTH-001
- **Description**: Verify login server action works correctly
- **Precondition**: Valid user credentials exist
- **Test Steps**:
  1. Call login with valid email and password
  2. Verify user is authenticated
  3. Verify session cookie is set
  4. Verify response contains user data
  5. Test with invalid credentials (should return error)
  6. Test with locked account (should return error)
- **Expected Result**: User authenticated, session created, response contains user data
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-AUTH-002: register Action
- **ID**: API-SA-AUTH-002
- **Description**: Verify register server action works correctly
- **Precondition**: None
- **Test Steps**:
  1. Call register with valid user data
  2. Verify user is created in Vendure
  3. Verify user can login after registration
  4. Test with invalid data (should return validation errors)
  5. Test with existing email (should return error)
- **Expected Result**: User created, can login, response contains user data
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-AUTH-003: logout Action
- **ID**: API-SA-AUTH-003
- **Description**: Verify logout server action works correctly
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Call logout with authenticated session
  2. Verify user is logged out
  3. Verify session cookie is cleared
  4. Verify subsequent requests are unauthenticated
- **Expected Result**: User logged out, session cleared
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-AUTH-004: getSession Action
- **ID**: API-SA-AUTH-004
- **Description**: Verify getSession server action works correctly
- **Precondition**: User may or may not be authenticated
- **Test Steps**:
  1. Call getSession with authenticated session
  2. Verify response contains session data
  3. Call getSession without authentication
  4. Verify response indicates no session
- **Expected Result**: Session data returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

#### Wishlist Server Actions

##### Test Case API-SA-WISHLIST-001: addToWishlist Action
- **ID**: API-SA-WISHLIST-001
- **Description**: Verify addToWishlist server action works correctly
- **Precondition**: User is authenticated, product exists
- **Test Steps**:
  1. Call addToWishlist with valid product ID
  2. Verify product is added to wishlist in database
  3. Verify response contains updated wishlist
  4. Test with invalid product ID (should return error)
  5. Test with unauthenticated user (should return error)
- **Expected Result**: Product added to wishlist, response contains updated wishlist
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-WISHLIST-002: removeFromWishlist Action
- **ID**: API-SA-WISHLIST-002
- **Description**: Verify removeFromWishlist server action works correctly
- **Precondition**: User is authenticated, item exists in wishlist
- **Test Steps**:
  1. Call removeFromWishlist with valid product ID
  2. Verify product is removed from wishlist in database
  3. Verify response contains updated wishlist
  4. Test with invalid product ID (should return error)
- **Expected Result**: Product removed from wishlist, response contains updated wishlist
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

##### Test Case API-SA-WISHLIST-003: getWishlist Action
- **ID**: API-SA-WISHLIST-003
- **Description**: Verify getWishlist server action works correctly
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Call getWishlist with authenticated session
  2. Verify response contains wishlist items
  3. Verify items have correct details
  4. Test with empty wishlist
- **Expected Result**: Wishlist data returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

#### Contact Server Actions

##### Test Case API-SA-CONTACT-001: submitInquiry Action
- **ID**: API-SA-CONTACT-001
- **Description**: Verify submitInquiry server action works correctly
- **Precondition**: None
- **Test Steps**:
  1. Call submitInquiry with valid inquiry data
  2. Verify inquiry is stored in Payload CMS
  3. Verify response indicates success
  4. Test with invalid data (should return validation errors)
- **Expected Result**: Inquiry stored, response indicates success
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Vitest, Playwright, manual testing

### 2. Payload CMS API Testing

#### Collection APIs

##### Test Case API-PAYLOAD-001: Get Products
- **ID**: API-PAYLOAD-001
- **Description**: Verify GET /api/products endpoint works correctly
- **Precondition**: Products exist in Payload CMS
- **Test Steps**:
  1. Send GET request to /api/products
  2. Verify response contains product list
  3. Verify response status code is 200
  4. Verify response includes all expected fields
  5. Test with pagination parameters
  6. Test with filtering parameters
- **Expected Result**: Products returned correctly with proper structure
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, curl, Playwright

##### Test Case API-PAYLOAD-002: Get Single Product
- **ID**: API-PAYLOAD-002
- **Description**: Verify GET /api/products/[id] endpoint works correctly
- **Precondition**: Product with specified ID exists
- **Test Steps**:
  1. Send GET request to /api/products/[id]
  2. Verify response contains product data
  3. Verify response status code is 200
  4. Verify response includes all expected fields
  5. Test with non-existent ID (should return 404)
- **Expected Result**: Product data returned correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, curl, Playwright

##### Test Case API-PAYLOAD-003: Create Product
- **ID**: API-PAYLOAD-003
- **Description**: Verify POST /api/products endpoint works correctly
- **Precondition**: Admin is authenticated
- **Test Steps**:
  1. Send POST request to /api/products with valid data
  2. Verify product is created in Payload CMS
  3. Verify response contains created product data
  4. Verify response status code is 201
  5. Test with invalid data (should return 400)
  6. Test without authentication (should return 401)
- **Expected Result**: Product created, response contains created product data
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, Payload Admin Panel

##### Test Case API-PAYLOAD-004: Update Product
- **ID**: API-PAYLOAD-004
- **Description**: Verify PATCH /api/products/[id] endpoint works correctly
- **Precondition**: Admin is authenticated, product exists
- **Test Steps**:
  1. Send PATCH request to /api/products/[id] with update data
  2. Verify product is updated in Payload CMS
  3. Verify response contains updated product data
  4. Verify response status code is 200
  5. Test with invalid data (should return 400)
  6. Test with non-existent ID (should return 404)
- **Expected Result**: Product updated, response contains updated product data
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, Payload Admin Panel

##### Test Case API-PAYLOAD-005: Delete Product
- **ID**: API-PAYLOAD-005
- **Description**: Verify DELETE /api/products/[id] endpoint works correctly
- **Precondition**: Admin is authenticated, product exists
- **Test Steps**:
  1. Send DELETE request to /api/products/[id]
  2. Verify product is deleted from Payload CMS
  3. Verify response status code is 204
  4. Test with non-existent ID (should return 404)
  5. Test without authentication (should return 401)
- **Expected Result**: Product deleted, response status code 204
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, Payload Admin Panel

#### Category APIs

##### Test Case API-PAYLOAD-006: Get Categories
- **ID**: API-PAYLOAD-006
- **Description**: Verify GET /api/categories endpoint works correctly
- **Precondition**: Categories exist in Payload CMS
- **Test Steps**:
  1. Send GET request to /api/categories
  2. Verify response contains category list
  3. Verify response status code is 200
  4. Test with pagination parameters
- **Expected Result**: Categories returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, curl

##### Test Case API-PAYLOAD-007: Get Category with Products
- **ID**: API-PAYLOAD-007
- **Description**: Verify GET /api/categories/[id] endpoint works correctly
- **Precondition**: Category with specified ID exists
- **Test Steps**:
  1. Send GET request to /api/categories/[id]
  2. Verify response contains category data
  3. Verify response includes related products
  4. Verify response status code is 200
- **Expected Result**: Category data with products returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, curl

#### Media APIs

##### Test Case API-PAYLOAD-008: Upload Media
- **ID**: API-PAYLOAD-008
- **Description**: Verify POST /api/media endpoint works correctly
- **Precondition**: Admin is authenticated
- **Test Steps**:
  1. Send POST request to /api/media with file attachment
  2. Verify media is uploaded to Payload CMS
  3. Verify response contains media data
  4. Verify response status code is 201
  5. Test with invalid file type (should return 400)
  6. Test with oversized file (should return 400)
- **Expected Result**: Media uploaded, response contains media data
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, Payload Admin Panel

##### Test Case API-PAYLOAD-009: Get Media
- **ID**: API-PAYLOAD-009
- **Description**: Verify GET /api/media/[id] endpoint works correctly
- **Precondition**: Media with specified ID exists
- **Test Steps**:
  1. Send GET request to /api/media/[id]
  2. Verify response contains media data
  3. Verify response status code is 200
  4. Test with non-existent ID (should return 404)
- **Expected Result**: Media data returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, curl

#### Inquiry APIs

##### Test Case API-PAYLOAD-010: Get Inquiries
- **ID**: API-PAYLOAD-010
- **Description**: Verify GET /api/inquiries endpoint works correctly
- **Precondition**: Admin is authenticated, inquiries exist
- **Test Steps**:
  1. Send GET request to /api/inquiries
  2. Verify response contains inquiry list
  3. Verify response status code is 200
  4. Test without authentication (should return 401)
- **Expected Result**: Inquiries returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, Payload Admin Panel

##### Test Case API-PAYLOAD-011: Get Single Inquiry
- **ID**: API-PAYLOAD-011
- **Description**: Verify GET /api/inquiries/[id] endpoint works correctly
- **Precondition**: Admin is authenticated, inquiry exists
- **Test Steps**:
  1. Send GET request to /api/inquiries/[id]
  2. Verify response contains inquiry data
  3. Verify response status code is 200
  4. Test with non-existent ID (should return 404)
- **Expected Result**: Inquiry data returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, Payload Admin Panel

#### GraphQL API

##### Test Case API-PAYLOAD-012: GraphQL Query
- **ID**: API-PAYLOAD-012
- **Description**: Verify GraphQL endpoint works correctly
- **Precondition**: GraphQL endpoint is accessible
- **Test Steps**:
  1. Send GraphQL query to /api/graphql
  2. Verify response contains query results
  3. Verify response status code is 200
  4. Test with invalid query (should return 400)
  5. Test with malformed query (should return 400)
- **Expected Result**: GraphQL query executed successfully
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground, curl

##### Test Case API-PAYLOAD-013: GraphQL Introspection
- **ID**: API-PAYLOAD-013
- **Description**: Verify GraphQL introspection works (if enabled)
- **Precondition**: GraphQL endpoint is accessible
- **Test Steps**:
  1. Send introspection query to /api/graphql
  2. Verify response contains schema information
  3. Verify response status code is 200
  4. Check if introspection is disabled in production
- **Expected Result**: GraphQL introspection works as expected
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GraphQL Playground, Postman

##### Test Case API-PAYLOAD-014: GraphQL Playground
- **ID**: API-PAYLOAD-014
- **Description**: Verify GraphQL Playground is accessible (if enabled)
- **Precondition**: GraphQL Playground is configured
- **Test Steps**:
  1. Navigate to /api/graphql-playground
  2. Verify Playground loads correctly
  3. Verify schema is visible
  4. Test query execution
  5. Check if Playground is disabled in production
- **Expected Result**: GraphQL Playground works as expected
- **Priority**: Low
- **Status**: ⏳ Pending
- **Tools**: Browser, manual testing

### 3. Vendure Shop API Testing

#### Product Catalog APIs

##### Test Case API-VENDURE-001: Get Products
- **ID**: API-VENDURE-001
- **Description**: Verify Vendure product catalog API works correctly
- **Precondition**: Vendure is running, products exist
- **Test Steps**:
  1. Send GraphQL query for products
  2. Verify response contains product list
  3. Verify response includes all expected fields (id, name, slug, price, etc.)
  4. Test with filtering parameters
  5. Test with pagination parameters
- **Expected Result**: Products returned correctly with proper structure
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground, Vendure Admin

##### Test Case API-VENDURE-002: Get Single Product
- **ID**: API-VENDURE-002
- **Description**: Verify Vendure single product API works correctly
- **Precondition**: Vendure is running, product exists
- **Test Steps**:
  1. Send GraphQL query for single product by ID or slug
  2. Verify response contains product data
  3. Verify response includes all expected fields
  4. Test with non-existent product (should return null or error)
- **Expected Result**: Product data returned correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-003: Search Products
- **ID**: API-VENDURE-003
- **Description**: Verify Vendure product search API works correctly
- **Precondition**: Vendure is running, products exist
- **Test Steps**:
  1. Send GraphQL query with search term
  2. Verify response contains matching products
  3. Test with partial matches
  4. Test with no matches
- **Expected Result**: Search returns correct results
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

#### Cart APIs

##### Test Case API-VENDURE-004: Add to Cart
- **ID**: API-VENDURE-004
- **Description**: Verify Vendure add to cart API works correctly
- **Precondition**: User session exists, product exists
- **Test Steps**:
  1. Send GraphQL mutation to add product to cart
  2. Verify product is added to cart in Vendure
  3. Verify response contains updated cart
  4. Test with invalid product ID (should return error)
  5. Test with invalid quantity (should return error)
- **Expected Result**: Product added to cart, response contains updated cart
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-005: Update Cart Item
- **ID**: API-VENDURE-005
- **Description**: Verify Vendure update cart item API works correctly
- **Precondition**: Item exists in cart
- **Test Steps**:
  1. Send GraphQL mutation to update cart item quantity
  2. Verify cart item quantity is updated in Vendure
  3. Verify response contains updated cart
  4. Test with quantity = 0 (should remove item)
  5. Test with invalid quantity (should return error)
- **Expected Result**: Cart item quantity updated, response contains updated cart
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-006: Remove from Cart
- **ID**: API-VENDURE-006
- **Description**: Verify Vendure remove from cart API works correctly
- **Precondition**: Item exists in cart
- **Test Steps**:
  1. Send GraphQL mutation to remove item from cart
  2. Verify item is removed from cart in Vendure
  3. Verify response contains updated cart
  4. Test with invalid item ID (should return error)
- **Expected Result**: Item removed from cart, response contains updated cart
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-007: Get Active Cart
- **ID**: API-VENDURE-007
- **Description**: Verify Vendure get active cart API works correctly
- **Precondition**: User session exists
- **Test Steps**:
  1. Send GraphQL query for active cart
  2. Verify response contains cart data
  3. Verify cart items have correct details
  4. Test with empty cart
- **Expected Result**: Cart data returned correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

#### Checkout APIs

##### Test Case API-VENDURE-008: Create Order
- **ID**: API-VENDURE-008
- **Description**: Verify Vendure create order API works correctly
- **Precondition**: User is authenticated, cart has items, shipping/payment info is valid
- **Test Steps**:
  1. Send GraphQL mutation to create order
  2. Verify order is created in Vendure
  3. Verify cart is emptied
  4. Verify response contains order data
  5. Test with invalid data (should return validation errors)
- **Expected Result**: Order created, cart emptied, response contains order data
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-009: Get Order
- **ID**: API-VENDURE-009
- **Description**: Verify Vendure get order API works correctly
- **Precondition**: User is authenticated, order exists
- **Test Steps**:
  1. Send GraphQL query for order by ID or code
  2. Verify response contains order data
  3. Verify order items have correct details
  4. Test with non-existent order (should return null or error)
  5. Test with another user's order (should return error)
- **Expected Result**: Order data returned correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-010: Get User Orders
- **ID**: API-VENDURE-010
- **Description**: Verify Vendure get user orders API works correctly
- **Precondition**: User is authenticated, orders exist
- **Test Steps**:
  1. Send GraphQL query for user's orders
  2. Verify response contains order list
  3. Verify orders have correct details
  4. Test with pagination parameters
- **Expected Result**: User orders returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

#### Customer APIs

##### Test Case API-VENDURE-011: Get Current Customer
- **ID**: API-VENDURE-011
- **Description**: Verify Vendure get current customer API works correctly
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Send GraphQL query for current customer
  2. Verify response contains customer data
  3. Verify response includes all expected fields
  4. Test without authentication (should return null or error)
- **Expected Result**: Customer data returned correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-012: Update Customer
- **ID**: API-VENDURE-012
- **Description**: Verify Vendure update customer API works correctly
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Send GraphQL mutation to update customer
  2. Verify customer is updated in Vendure
  3. Verify response contains updated customer data
  4. Test with invalid data (should return validation errors)
- **Expected Result**: Customer updated, response contains updated customer data
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-013: Get Customer Addresses
- **ID**: API-VENDURE-013
- **Description**: Verify Vendure get customer addresses API works correctly
- **Precondition**: User is authenticated, addresses exist
- **Test Steps**:
  1. Send GraphQL query for customer addresses
  2. Verify response contains address list
  3. Verify addresses have correct details
- **Expected Result**: Customer addresses returned correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-014: Create Address
- **ID**: API-VENDURE-014
- **Description**: Verify Vendure create address API works correctly
- **Precondition**: User is authenticated
- **Test Steps**:
  1. Send GraphQL mutation to create address
  2. Verify address is created in Vendure
  3. Verify response contains created address data
  4. Test with invalid data (should return validation errors)
- **Expected Result**: Address created, response contains created address data
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-015: Update Address
- **ID**: API-VENDURE-015
- **Description**: Verify Vendure update address API works correctly
- **Precondition**: User is authenticated, address exists
- **Test Steps**:
  1. Send GraphQL mutation to update address
  2. Verify address is updated in Vendure
  3. Verify response contains updated address data
  4. Test with invalid data (should return validation errors)
- **Expected Result**: Address updated, response contains updated address data
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

##### Test Case API-VENDURE-016: Delete Address
- **ID**: API-VENDURE-016
- **Description**: Verify Vendure delete address API works correctly
- **Precondition**: User is authenticated, address exists
- **Test Steps**:
  1. Send GraphQL mutation to delete address
  2. Verify address is deleted from Vendure
  3. Verify response status indicates success
  4. Test with non-existent address (should return error)
- **Expected Result**: Address deleted, response indicates success
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, GraphQL Playground

### 4. Integration Testing

#### Frontend-Backend Integration

##### Test Case API-INT-001: Cart Integration
- **ID**: API-INT-001
- **Description**: Verify frontend cart integrates correctly with backend
- **Precondition**: Application is running, user is on product page
- **Test Steps**:
  1. Click "Add to Cart" button on product page
  2. Verify Server Action is called
  3. Verify Vendure API is called
  4. Verify cart UI updates correctly
  5. Verify cart persists across page navigation
- **Expected Result**: Cart integration works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, browser DevTools

##### Test Case API-INT-002: Authentication Integration
- **ID**: API-INT-002
- **Description**: Verify frontend authentication integrates correctly with backend
- **Precondition**: Application is running
- **Test Steps**:
  1. Submit login form
  2. Verify Server Action is called
  3. Verify Vendure API is called
  4. Verify user is authenticated
  5. Verify session is created
  6. Verify UI updates to show authenticated state
- **Expected Result**: Authentication integration works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, browser DevTools

##### Test Case API-INT-003: Product Listing Integration
- **ID**: API-INT-003
- **Description**: Verify frontend product listing integrates correctly with backend
- **Precondition**: Application is running, products exist
- **Test Steps**:
  1. Navigate to product listing page
  2. Verify Payload CMS API is called
  3. Verify products display correctly
  4. Verify pricing is fetched from Vendure
  5. Test with filters and sorting
- **Expected Result**: Product listing integration works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, browser DevTools

##### Test Case API-INT-004: Product Detail Integration
- **ID**: API-INT-004
- **Description**: Verify frontend product detail integrates correctly with backend
- **Precondition**: Application is running, product exists
- **Test Steps**:
  1. Navigate to product detail page
  2. Verify Payload CMS API is called for product data
  3. Verify Vendure API is called for pricing
  4. Verify product details display correctly
  5. Verify "Add to Cart" button works
- **Expected Result**: Product detail integration works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, browser DevTools

##### Test Case API-INT-005: Checkout Integration
- **ID**: API-INT-005
- **Description**: Verify frontend checkout integrates correctly with backend
- **Precondition**: Application is running, items in cart
- **Test Steps**:
  1. Navigate to checkout page
  2. Fill in shipping and payment information
  3. Submit checkout form
  4. Verify Server Action is called
  5. Verify Vendure API is called
  6. Verify order is created
  7. Verify cart is emptied
  8. Verify order confirmation displays
- **Expected Result**: Checkout integration works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, browser DevTools

#### Payload CMS Integration

##### Test Case API-INT-006: Payload Data Fetching
- **ID**: API-INT-006
- **Description**: Verify Next.js fetches data from Payload CMS correctly
- **Precondition**: Application is running, Payload CMS has data
- **Test Steps**:
  1. Navigate to homepage
  2. Verify Payload CMS API is called
  3. Verify data is fetched and displayed
  4. Test with different locales
  5. Test with cached data
- **Expected Result**: Payload data fetching works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, browser DevTools

##### Test Case API-INT-007: Payload Static Generation
- **ID**: API-INT-007
- **Description**: Verify Payload data is used for static generation
- **Precondition**: Build process runs
- **Test Steps**:
  1. Run build process
  2. Verify Payload CMS API is called during build
  3. Verify static pages are generated with Payload data
  4. Check generated pages for correct data
- **Expected Result**: Payload data is used for static generation
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual build testing

##### Test Case API-INT-008: Payload Fallback Data
- **ID**: API-INT-008
- **Description**: Verify fallback data is used when Vendure is unavailable
- **Precondition**: Vendure is down, Payload has mock data
- **Test Steps**:
  1. Stop Vendure service
  2. Navigate to product page
  3. Verify fallback data is displayed
  4. Verify UI indicates fallback mode
  5. Restart Vendure and verify live data returns
- **Expected Result**: Fallback data is used when Vendure is unavailable
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Playwright, manual testing

#### Vendure Integration

##### Test Case API-INT-009: Vendure Live Pricing
- **ID**: API-INT-009
- **Description**: Verify live pricing is fetched from Vendure
- **Precondition**: Application is running, Vendure is running
- **Test Steps**:
  1. Navigate to product page
  2. Verify Vendure API is called for pricing
  3. Verify price displays correctly
  4. Change price in Vendure admin
  5. Refresh product page and verify price updates
- **Expected Result**: Live pricing is fetched from Vendure
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, browser DevTools

##### Test Case API-INT-010: Vendure Cart Sync
- **ID**: API-INT-010
- **Description**: Verify cart is synced with Vendure
- **Precondition**: User is authenticated, Vendure is running
- **Test Steps**:
  1. Add item to cart via frontend
  2. Verify cart is updated in Vendure
  3. Add item to cart via Vendure API directly
  4. Verify cart UI updates in frontend
  5. Remove item from cart via frontend
  6. Verify cart is updated in Vendure
- **Expected Result**: Cart is synced with Vendure
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, Postman

##### Test Case API-INT-011: Vendure Order Sync
- **ID**: API-INT-011
- **Description**: Verify orders are synced with Vendure
- **Precondition**: User is authenticated, cart has items, Vendure is running
- **Test Steps**:
  1. Complete checkout via frontend
  2. Verify order is created in Vendure
  3. Verify order appears in Vendure admin
  4. Verify order appears in user's order history
- **Expected Result**: Orders are synced with Vendure
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, Vendure Admin

##### Test Case API-INT-012: Vendure Customer Sync
- **ID**: API-INT-012
- **Description**: Verify customers are synced with Vendure
- **Precondition**: User registers or logs in, Vendure is running
- **Test Steps**:
  1. Register new user via frontend
  2. Verify customer is created in Vendure
  3. Verify customer appears in Vendure admin
  4. Login with existing user
  5. Verify customer data is synced
- **Expected Result**: Customers are synced with Vendure
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, Vendure Admin

### 5. API Performance Testing

#### Test Case API-PERF-001: Response Time
- **ID**: API-PERF-001
- **Description**: Verify API response times are acceptable
- **Test Steps**:
  1. Measure response time for all API endpoints
  2. Verify response time ≤ 500ms for simple queries
  3. Verify response time ≤ 1000ms for complex queries
  4. Test under different load conditions
- **Expected Result**: API response times are acceptable
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, k6, manual timing

#### Test Case API-PERF-002: Throughput
- **ID**: API-PERF-002
- **Description**: Verify API throughput is acceptable
- **Test Steps**:
  1. Measure requests per second for all API endpoints
  2. Verify throughput ≥ 100 req/s for simple endpoints
  3. Verify throughput ≥ 50 req/s for complex endpoints
  4. Test under different load conditions
- **Expected Result**: API throughput is acceptable
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: k6, Artillery, manual testing

#### Test Case API-PERF-003: Concurrency
- **ID**: API-PERF-003
- **Description**: Verify API handles concurrent requests
- **Test Steps**:
  1. Send 10 concurrent requests to same endpoint
  2. Verify all requests complete successfully
  3. Verify no race conditions
  4. Test with 50 concurrent requests
  5. Test with 100 concurrent requests
- **Expected Result**: API handles concurrent requests correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: k6, Artillery, Postman

#### Test Case API-PERF-004: Rate Limiting
- **ID**: API-PERF-004
- **Description**: Verify API rate limiting works correctly
- **Test Steps**:
  1. Send rapid requests to rate-limited endpoint
  2. Verify rate limiting is triggered after threshold
  3. Verify appropriate response (429 Too Many Requests)
  4. Verify rate limiting resets after time window
  5. Test with different rate limit configurations
- **Expected Result**: API rate limiting works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, k6, manual testing

### 6. API Security Testing

#### Test Case API-SEC-001: Authentication Required
- **ID**: API-SEC-001
- **Description**: Verify protected endpoints require authentication
- **Test Steps**:
  1. Send request to protected endpoint without authentication
  2. Verify response status code is 401 Unauthorized
  3. Test all protected endpoints
- **Expected Result**: Protected endpoints require authentication
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, curl

#### Test Case API-SEC-002: Authorization Enforced
- **ID**: API-SEC-002
- **Description**: Verify endpoints enforce proper authorization
- **Test Steps**:
  1. Send request to endpoint with insufficient permissions
  2. Verify response status code is 403 Forbidden
  3. Test with different user roles
  4. Verify users can only access their own data
- **Expected Result**: Endpoints enforce proper authorization
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, manual testing

#### Test Case API-SEC-003: Input Validation
- **ID**: API-SEC-003
- **Description**: Verify API input validation works correctly
- **Test Steps**:
  1. Send requests with invalid input data
  2. Verify response status code is 400 Bad Request
  3. Verify error messages are descriptive
  4. Test with various invalid inputs
- **Expected Result**: API input validation works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, manual testing

#### Test Case API-SEC-004: SQL Injection Protection
- **ID**: API-SEC-004
- **Description**: Verify API is protected against SQL injection
- **Test Steps**:
  1. Send requests with SQL injection payloads
  2. Verify requests are rejected or sanitized
  3. Verify no database errors are exposed
  4. Test all input parameters
- **Expected Result**: API is protected against SQL injection
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: SQLMap, Burp Suite, manual testing

#### Test Case API-SEC-005: XSS Protection
- **ID**: API-SEC-005
- **Description**: Verify API is protected against XSS
- **Test Steps**:
  1. Send requests with XSS payloads
  2. Verify payloads are sanitized or escaped
  3. Verify no XSS vulnerabilities in responses
  4. Test all output fields
- **Expected Result**: API is protected against XSS
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: XSStrike, Burp Suite, manual testing

#### Test Case API-SEC-006: CSRF Protection
- **ID**: API-SEC-006
- **Description**: Verify API is protected against CSRF
- **Test Steps**:
  1. Send state-changing requests without CSRF token
  2. Verify requests are rejected
  3. Verify CSRF token validation
  4. Test with invalid CSRF token
- **Expected Result**: API is protected against CSRF
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, manual testing

#### Test Case API-SEC-007: Security Headers
- **ID**: API-SEC-007
- **Description**: Verify API responses include security headers
- **Test Steps**:
  1. Check response headers for security headers
  2. Verify Content-Security-Policy header
  3. Verify X-Content-Type-Options header
  4. Verify X-Frame-Options header
  5. Verify other security headers
- **Expected Result**: API responses include security headers
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: curl, Postman, security header checkers

#### Test Case API-SEC-008: HTTPS Enforcement
- **ID**: API-SEC-008
- **Description**: Verify API enforces HTTPS
- **Test Steps**:
  1. Attempt to access API over HTTP
  2. Verify request is redirected to HTTPS or rejected
  3. Verify HSTS header is present
- **Expected Result**: API enforces HTTPS
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: curl, browser DevTools

### 7. API Error Handling Testing

#### Test Case API-ERR-001: Error Responses
- **ID**: API-ERR-001
- **Description**: Verify API error responses are consistent
- **Test Steps**:
  1. Trigger various error scenarios
  2. Verify error responses have consistent structure
  3. Verify error responses include error code and message
  4. Verify error responses don't expose sensitive information
- **Expected Result**: API error responses are consistent and secure
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, manual testing

#### Test Case API-ERR-002: HTTP Status Codes
- **ID**: API-ERR-002
- **Description**: Verify API uses appropriate HTTP status codes
- **Test Steps**:
  1. Trigger various scenarios (success, validation error, not found, unauthorized, etc.)
  2. Verify appropriate status codes are returned
  3. Check for correct status codes:
     - 200 OK for successful GET requests
     - 201 Created for successful POST requests
     - 204 No Content for successful DELETE requests
     - 400 Bad Request for validation errors
     - 401 Unauthorized for missing authentication
     - 403 Forbidden for insufficient permissions
     - 404 Not Found for non-existent resources
     - 422 Unprocessable Entity for semantic errors
     - 429 Too Many Requests for rate limiting
- **Expected Result**: API uses appropriate HTTP status codes
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, manual testing

#### Test Case API-ERR-003: Error Logging
- **ID**: API-ERR-003
- **Description**: Verify API errors are logged
- **Test Steps**:
  1. Trigger various error scenarios
  2. Verify errors are logged with appropriate details
  3. Check log entries for sensitive data exposure
  4. Verify log levels are appropriate
- **Expected Result**: API errors are logged appropriately
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Log analysis, manual testing

#### Test Case API-ERR-004: Fallback Mechanisms
- **ID**: API-ERR-004
- **Description**: Verify API has proper fallback mechanisms
- **Test Steps**:
  1. Simulate Vendure API failure
  2. Verify fallback data is used
  3. Verify graceful degradation
  4. Verify error is logged
  5. Verify user is notified appropriately
- **Expected Result**: API has proper fallback mechanisms
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual testing, error simulation

### 8. API Documentation Testing

#### Test Case API-DOC-001: API Documentation Existence
- **ID**: API-DOC-001
- **Description**: Verify API documentation exists
- **Test Steps**:
  1. Check for API documentation in the repository
  2. Verify documentation is accessible to developers
  3. Check for OpenAPI/Swagger documentation
- **Expected Result**: API documentation exists and is accessible
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual review

#### Test Case API-DOC-002: API Documentation Completeness
- **ID**: API-DOC-002
- **Description**: Verify API documentation is complete
- **Test Steps**:
  1. Check if all endpoints are documented
  2. Verify documentation includes:
     - Endpoint URL
     - HTTP method
     - Description
     - Request parameters
     - Request body schema
     - Response schema
     - Example requests and responses
     - Error responses
     - Authentication requirements
- **Expected Result**: API documentation is complete
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual review

#### Test Case API-DOC-003: API Documentation Accuracy
- **ID**: API-DOC-003
- **Description**: Verify API documentation is accurate
- **Test Steps**:
  1. Compare documentation with actual API behavior
  2. Verify all documented endpoints exist
  3. Verify all documented parameters work
  4. Verify all documented responses match actual responses
- **Expected Result**: API documentation is accurate
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Postman, Insomnia, manual testing

#### Test Case API-DOC-004: OpenAPI/Swagger Validation
- **ID**: API-DOC-004
- **Description**: Verify OpenAPI/Swagger documentation is valid
- **Test Steps**:
  1. Check if OpenAPI/Swagger specification exists
  2. Validate specification using OpenAPI validator
  3. Verify specification matches actual API
  4. Test with Swagger UI
- **Expected Result**: OpenAPI/Swagger documentation is valid
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: OpenAPI Validator, Swagger UI

#### Test Case API-DOC-005: GraphQL Schema Documentation
- **ID**: API-DOC-005
- **Description**: Verify GraphQL schema is documented
- **Test Steps**:
  1. Check if GraphQL schema is documented
  2. Verify schema documentation includes:
     - Types
     - Queries
     - Mutations
     - Input types
     - Enums
     - Directives
  3. Test with GraphQL Playground
- **Expected Result**: GraphQL schema is documented
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: GraphQL Playground, manual review

### 9. Data Flow Testing

#### Test Case API-DATA-001: Payload to Frontend Data Flow
- **ID**: API-DATA-001
- **Description**: Verify data flow from Payload CMS to frontend
- **Test Steps**:
  1. Update product in Payload CMS
  2. Refresh frontend product page
  3. Verify updated data is displayed
  4. Check for caching issues
- **Expected Result**: Data flows correctly from Payload CMS to frontend
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, Payload Admin, manual testing

#### Test Case API-DATA-002: Vendure to Frontend Data Flow
- **ID**: API-DATA-002
- **Description**: Verify data flow from Vendure to frontend
- **Test Steps**:
  1. Update product price in Vendure
  2. Refresh frontend product page
  3. Verify updated price is displayed
  4. Check for caching issues
- **Expected Result**: Data flows correctly from Vendure to frontend
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, Vendure Admin, manual testing

#### Test Case API-DATA-003: Frontend to Vendure Data Flow
- **ID**: API-DATA-003
- **Description**: Verify data flow from frontend to Vendure
- **Test Steps**:
  1. Add item to cart via frontend
  2. Verify cart is updated in Vendure
  3. Check Vendure admin for cart data
  4. Verify data consistency
- **Expected Result**: Data flows correctly from frontend to Vendure
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, Vendure Admin, manual testing

#### Test Case API-DATA-004: Payload to Vendure Data Sync
- **ID**: API-DATA-004
- **Description**: Verify data synchronization between Payload and Vendure
- **Test Steps**:
  1. Create product in Payload CMS
  2. Verify product exists in Vendure (if applicable)
  3. Update product in Payload CMS
  4. Verify product is updated in Vendure (if applicable)
- **Expected Result**: Data is synchronized between Payload and Vendure (as designed)
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Payload Admin, Vendure Admin, manual testing

#### Test Case API-DATA-005: Fallback Data Flow
- **ID**: API-DATA-005
- **Description**: Verify fallback data flow when primary source is unavailable
- **Test Steps**:
  1. Stop Vendure service
  2. Navigate to product page
  3. Verify fallback data from Payload is displayed
  4. Verify UI indicates fallback mode
  5. Restart Vendure and verify live data returns
- **Expected Result**: Fallback data flow works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Playwright, manual testing

### 10. Third-Party Integration Testing

#### Test Case API-3RD-001: Payment Gateway Integration
- **ID**: API-3RD-001
- **Description**: Verify payment gateway integration works correctly
- **Precondition**: Payment gateway is configured, checkout flow is set up
- **Test Steps**:
  1. Proceed to checkout with payment
  2. Verify payment gateway is invoked
  3. Verify payment processing
  4. Verify order is created on successful payment
  5. Verify order is not created on failed payment
  6. Test with different payment methods
- **Expected Result**: Payment gateway integration works correctly
- **Priority**: Critical
- **Status**: ⏳ Pending
- **Tools**: Playwright, manual testing

#### Test Case API-3RD-002: Analytics Integration
- **ID**: API-3RD-002
- **Description**: Verify analytics integration works correctly
- **Test Steps**:
  1. Navigate through the application
  2. Verify analytics events are sent
  3. Check analytics dashboard for data
  4. Verify sensitive data is not sent to analytics
- **Expected Result**: Analytics integration works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Browser DevTools, analytics dashboard

#### Test Case API-3RD-003: Social Media Integration
- **ID**: API-3RD-003
- **Description**: Verify social media integration works correctly
- **Test Steps**:
  1. Test social sharing functionality
  2. Verify social media widgets load
  3. Verify social media authentication works (if applicable)
  4. Check for proper Open Graph/Twitter Card meta tags
- **Expected Result**: Social media integration works correctly
- **Priority**: Medium
- **Status**: ⏳ Pending
- **Tools**: Manual testing, browser DevTools

#### Test Case API-3RD-004: Email Service Integration
- **ID**: API-3RD-004
- **Description**: Verify email service integration works correctly
- **Test Steps**:
  1. Trigger email sending (contact form, order confirmation, etc.)
  2. Verify email is sent
  3. Check email content
  4. Verify email delivery
  5. Test with different email templates
- **Expected Result**: Email service integration works correctly
- **Priority**: High
- **Status**: ⏳ Pending
- **Tools**: Manual testing, email client

#### Test Case API-3RD-005: SMS Service Integration (if applicable)
- **ID**: API-3RD-005
- **Description**: Verify SMS service integration works correctly
- **Test Steps**:
  1. Trigger SMS sending (OTP, notifications, etc.)
  2. Verify SMS is sent
  3. Check SMS content
  4. Verify SMS delivery
- **Expected Result**: SMS service integration works correctly
- **Priority**: Medium (if applicable)
- **Status**: ⏳ Pending
- **Tools**: Manual testing

---

## 📊 Test Results

### Summary
| Category | Total | Passed | Failed | Pending | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Server Actions - Cart | 4 | 0 | 0 | 4 | 0% |
| Server Actions - Authentication | 4 | 0 | 0 | 4 | 0% |
| Server Actions - Wishlist | 3 | 0 | 0 | 3 | 0% |
| Server Actions - Contact | 1 | 0 | 0 | 1 | 0% |
| Payload CMS API - Collections | 11 | 0 | 0 | 11 | 0% |
| Payload CMS API - GraphQL | 3 | 0 | 0 | 3 | 0% |
| Vendure API - Products | 3 | 0 | 0 | 3 | 0% |
| Vendure API - Cart | 4 | 0 | 0 | 4 | 0% |
| Vendure API - Checkout | 3 | 0 | 0 | 3 | 0% |
| Vendure API - Customers | 6 | 0 | 0 | 6 | 0% |
| Integration - Frontend-Backend | 5 | 0 | 0 | 5 | 0% |
| Integration - Payload | 3 | 0 | 0 | 3 | 0% |
| Integration - Vendure | 4 | 0 | 0 | 4 | 0% |
| API Performance | 4 | 0 | 0 | 4 | 0% |
| API Security | 8 | 0 | 0 | 8 | 0% |
| API Error Handling | 4 | 0 | 0 | 4 | 0% |
| API Documentation | 5 | 0 | 0 | 5 | 0% |
| Data Flow | 5 | 0 | 0 | 5 | 0% |
| Third-Party Integration | 5 | 0 | 0 | 5 | 0% |
| **Total** | **85** | **0** | **0** | **85** | **0%** |

### API Coverage
| API Type | Endpoints | Test Cases | Coverage |
|----------|-----------|------------|----------|
| Server Actions | 12 | 12 | 100% |
| Payload REST API | 5+ | 11 | ~70% |
| Payload GraphQL API | 1 | 3 | 100% |
| Vendure GraphQL API | 20+ | 20 | ~50% |
| Integration Tests | N/A | 15 | N/A |
| Other Tests | N/A | 24 | N/A |

### Integration Coverage
| Integration | Test Cases | Status |
|-------------|------------|--------|
| Frontend ↔ Server Actions | 5 | ⏳ Pending |
| Server Actions ↔ Vendure | 4 | ⏳ Pending |
| Next.js ↔ Payload CMS | 3 | ⏳ Pending |
| Payload ↔ Vendure | 4 | ⏳ Pending |
| Third-Party Services | 5 | ⏳ Pending |

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
1. **Run existing API tests** - Execute existing Vitest and Playwright tests
2. **Set up API monitoring** - Track API usage, errors, and performance
3. **Document all API endpoints** - Create comprehensive API documentation
4. **Implement API testing in CI/CD** - Add API tests to deployment pipeline
5. **Fix critical API issues** - Address any critical bugs found in testing
6. **Verify integration points** - Test all integration between services

### Short-term Improvements (1-4 weeks)

#### API Testing
1. **Expand API test coverage** - Add tests for all endpoints
2. **Implement contract testing** - Test API contracts between services
3. **Add performance testing** - Test API response times and throughput
4. **Implement security testing** - Test for vulnerabilities in API endpoints
5. **Add error handling tests** - Test various error scenarios
6. **Implement property-based testing** - For more thorough API testing

#### API Design
1. **Standardize API responses** - Consistent response structure across all endpoints
2. **Implement proper error handling** - Consistent error responses with appropriate status codes
3. **Add request validation** - Validate all incoming requests
4. **Implement response validation** - Validate all outgoing responses
5. **Add API versioning** - For backward compatibility
6. **Implement rate limiting** - Protect against abuse

#### API Documentation
1. **Create OpenAPI/Swagger documentation** - For REST APIs
2. **Document GraphQL schema** - For GraphQL APIs
3. **Add examples** - Request and response examples for all endpoints
4. **Create API usage guides** - For developers
5. **Implement interactive documentation** - Swagger UI, GraphQL Playground

#### API Security
1. **Implement proper authentication** - For all protected endpoints
2. **Add proper authorization** - Role-based access control
3. **Implement input validation** - Sanitize all inputs
4. **Add security headers** - Content-Security-Policy, etc.
5. **Implement CORS properly** - Restrict origins appropriately
6. **Add rate limiting** - Protect against brute force and DoS

#### API Performance
1. **Implement caching** - For frequently accessed data
2. **Optimize database queries** - Reduce query time
3. **Add response compression** - Reduce response size
4. **Implement pagination** - For large datasets
5. **Optimize payload sizes** - Reduce unnecessary data in responses

### Medium-term Improvements (1-3 months)

#### API Architecture
1. **Implement API Gateway** - Centralized API management
2. **Add API analytics** - Track API usage and performance
3. **Implement API versioning** - For backward compatibility
4. **Add API deprecation strategy** - For smooth transitions
5. **Implement API mocking** - For development and testing

#### API Testing
1. **Implement automated API testing** - In CI/CD pipeline
2. **Add contract testing** - Between frontend and backend
3. **Implement performance testing** - Load testing, stress testing
4. **Add security scanning** - Automated vulnerability scanning
5. **Implement API monitoring** - Track API health and usage

#### API Documentation
1. **Create comprehensive API documentation** - For all APIs
2. **Add interactive documentation** - Swagger UI, GraphQL Playground
3. **Implement API changelog** - Track API changes
4. **Add API usage examples** - Code examples for developers
5. **Create API SDKs** - For easier integration

#### Integration Improvements
1. **Improve error handling** - Better error messages and fallbacks
2. **Add retry mechanisms** - For transient failures
3. **Implement circuit breakers** - For external service failures
4. **Add monitoring** - For integration health
5. **Implement data synchronization** - Between Payload and Vendure

### Long-term Improvements (3-6 months)

#### API Strategy
1. **Implement API-first design** - Design APIs before implementation
2. **Add API governance** - Standards, guidelines, review process
3. **Implement API lifecycle management** - From design to deprecation
4. **Add API analytics** - Track API usage and business impact
5. **Implement API monetization** - If applicable

#### Advanced Testing
1. **Implement chaos engineering** - Test API resilience
2. **Add synthetic monitoring** - Simulate user behavior
3. **Implement canary testing** - For API changes
4. **Add A/B testing** - For API features
5. **Implement performance benchmarking** - Track performance over time

#### Developer Experience
1. **Create API style guide** - Consistent API design patterns
2. **Add API linting** - Enforce API standards
3. **Implement API mocking** - For development and testing
4. **Create API client libraries** - For easier integration
5. **Add API playground** - For exploration and testing

### Specific Recommendations for NPF Storefront

#### For Server Actions
1. **Add comprehensive unit tests** - For all Server Actions
2. **Implement input validation** - Validate all inputs in Server Actions
3. **Add proper error handling** - Consistent error responses
4. **Implement authentication checks** - For protected Server Actions
5. **Add authorization checks** - For role-based access control
6. **Implement rate limiting** - Protect against abuse

#### For Payload CMS API
1. **Add comprehensive API tests** - For all Payload endpoints
2. **Implement proper authentication** - For admin endpoints
3. **Add input validation** - Sanitize all inputs
4. **Implement proper error handling** - Consistent error responses
5. **Add API documentation** - For Payload API
6. **Implement caching** - For frequently accessed data

#### For Vendure API
1. **Add comprehensive API tests** - For all Vendure operations
2. **Implement proper authentication** - For Shop API
3. **Add input validation** - Sanitize all inputs
4. **Implement proper error handling** - Consistent error responses
5. **Add API documentation** - For Vendure API
6. **Implement caching** - For product catalog data

#### For Integration
1. **Add integration tests** - Between all services
2. **Implement proper error handling** - For integration failures
3. **Add retry mechanisms** - For transient failures
4. **Implement circuit breakers** - For external service failures
5. **Add monitoring** - For integration health
6. **Implement fallback mechanisms** - For when services are unavailable

#### For API Performance
1. **Implement caching** - For frequently accessed data
2. **Optimize database queries** - Reduce query time
3. **Add response compression** - Reduce response size
4. **Implement pagination** - For large datasets
5. **Optimize payload sizes** - Reduce unnecessary data in responses
6. **Add performance monitoring** - Track API performance

#### For API Documentation
1. **Create OpenAPI documentation** - For REST APIs
2. **Document GraphQL schema** - For GraphQL APIs
3. **Add examples** - Request and response examples
4. **Create usage guides** - For developers
5. **Implement interactive documentation** - Swagger UI, GraphQL Playground

---

## 🎯 Conclusion

This API & Integration Testing Report outlines a comprehensive testing strategy for ensuring all APIs and integrations in the NPF Storefront application work correctly, reliably, and securely. With **85 detailed test cases** covering Server Actions, Payload CMS API, Vendure API, integration testing, performance testing, security testing, error handling, documentation, data flow, and third-party integrations, this report provides a solid foundation for API validation and integration verification.

### Key Findings
- **Total Test Cases**: 85
- **API Types Covered**: 4 (Server Actions, Payload REST, Payload GraphQL, Vendure GraphQL)
- **Integration Points Covered**: 5 (Frontend-Backend, Server Actions-Vendure, Next.js-Payload, Payload-Vendure, Third-Party)
- **Current Status**: All tests pending execution
- **Coverage**: All major APIs and integrations covered

### API Health Overview
| Aspect | Status | Notes |
|--------|--------|-------|
| Server Actions | ⏳ Unknown | Need comprehensive testing |
| Payload CMS API | ⏳ Unknown | Need comprehensive testing |
| Vendure API | ⏳ Unknown | Need comprehensive testing |
| Integration | ⏳ Unknown | Need end-to-end testing |
| Performance | ⏳ Unknown | Need performance testing |
| Security | ⏳ Unknown | Need security testing |
| Error Handling | ⏳ Unknown | Need error scenario testing |
| Documentation | ⏳ Unknown | Need documentation review |

### Next Steps
1. Execute all existing API tests (Vitest, Playwright)
2. Run manual API testing for all endpoints
3. Document all API endpoints and integrations
4. Implement API testing in CI/CD pipeline
5. Set up API monitoring and alerting
6. Fix any issues found in testing
7. Regularly update API tests as APIs evolve

### API Maturity Model
| Level | Description | Current | Target |
|-------|-------------|--------|--------|
| Level 1 - Ad-hoc | APIs tested manually, no automation | ⏳ Unknown | Level 3 |
| Level 2 - Basic | Basic automated tests, some documentation | ⏳ Unknown | Level 4 |
| Level 3 - Intermediate | Comprehensive tests, good documentation | ⏳ Unknown | Level 4 |
| Level 4 - Advanced | Full test coverage, excellent documentation | ⏳ Unknown | Level 5 |
| Level 5 - Optimized | Continuous testing, API-first design | ⏳ Unknown | Level 5 |

### Sign-off
| Role | Name | Date | Signature |
|------|------|------|-----------|
| API Engineer | [Your Name] | [Date] | [Signature] |
| Backend Developer | [Your Name] | [Date] | [Signature] |
| Frontend Developer | [Your Name] | [Date] | [Signature] |
| QA Engineer | [Your Name] | [Date] | [Signature] |
| DevOps Engineer | [Your Name] | [Date] | [Signature] |
| Product Manager | [Your Name] | [Date] | [Signature] |

---

## 📅 Testing Timeline

| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
| Test Case Design | 2026-09-21 | 2026-09-24 | In Progress |
| Existing Test Execution | 2026-09-24 | 2026-09-25 | Pending |
| Manual API Testing | 2026-09-25 | 2026-09-27 | Pending |
| Integration Testing | 2026-09-27 | 2026-09-28 | Pending |
| Performance Testing | 2026-09-28 | 2026-09-29 | Pending |
| Security Testing | 2026-09-29 | 2026-09-30 | Pending |
| Documentation Review | 2026-09-30 | 2026-09-30 | Pending |
| Issue Fixing | 2026-09-30 | 2026-10-02 | Pending |
| CI/CD Integration | 2026-10-02 | 2026-10-03 | Pending |
| Final Report | 2026-10-03 | 2026-10-04 | Pending |

---

## 📚 Appendices

### Appendix A: API Inventory
- Complete list of all API endpoints
- Endpoint details (URL, method, description, parameters, responses)
- Authentication requirements
- Rate limiting information

### Appendix B: API Testing Setup
- Vitest configuration for API testing
- Playwright configuration for API testing
- Postman/Insomnia collection setup
- CI/CD integration for API tests

### Appendix C: API Documentation Templates
- OpenAPI/Swagger template
- GraphQL schema documentation template
- API usage guide template
- API changelog template

### Appendix D: API Best Practices
- REST API design best practices
- GraphQL API design best practices
- API security best practices
- API performance best practices
- API documentation best practices

### Appendix E: API Testing Checklist
- Pre-development API testing checklist
- Development API testing checklist
- QA API testing checklist
- Production API testing checklist

### Appendix F: Integration Architecture
- System architecture diagram
- Data flow diagrams
- Integration sequence diagrams
- Service dependency map

### Appendix G: API Resources
- REST API Tutorial
- GraphQL Documentation
- OpenAPI Specification
- Postman Learning Center
- API Security Guidelines
- API Performance Optimization Guide

---

*Report generated on: 2026-09-21*
*Report version: 1.0*
*Next review date: 2026-09-28*
