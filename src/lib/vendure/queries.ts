/**
 * Shop API GraphQL documents. Field selections are kept to exactly what
 * order-mapper.ts and the checkout actions consume — not a general-purpose
 * client, just what this storefront needs.
 */

const ORDER_FRAGMENT = `
  fragment NpfOrder on Order {
    id
    code
    state
    createdAt
    currencyCode
    subTotalWithTax
    shippingWithTax
    totalWithTax
    # Must list subfields: Vendure types this as OrderCustomFields, not JSON,
    # and a bare customFields selection fails GraphQL validation (HTTP 400) —
    # which surfaces as "cart unavailable" on every page that reads the order.
    customFields {
      prepaidShipping
      customerNotes
    }
    shippingAddress {
      fullName
      company
      streetLine1
      city
      province
      postalCode
      phoneNumber
    }
    shippingLines {
      shippingMethod {
        id
        code
        name
      }
      priceWithTax
    }
    customer {
      firstName
      lastName
      emailAddress
      phoneNumber
    }
    payments {
      id
      method
      metadata
    }
    lines {
      id
      quantity
      linePriceWithTax
      productVariant {
        id
        sku
        name
        product {
          slug
          featuredAsset {
            preview
          }
        }
      }
    }
  }
`

export const ACTIVE_ORDER_QUERY = `
  ${ORDER_FRAGMENT}
  query ActiveOrder {
    activeOrder {
      ...NpfOrder
    }
  }
`

export const ORDER_BY_CODE_QUERY = `
  ${ORDER_FRAGMENT}
  query OrderByCode($code: String!) {
    orderByCode(code: $code) {
      ...NpfOrder
    }
  }
`

const ORDER_RESULT_FRAGMENT = `
  ${ORDER_FRAGMENT}
  fragment NpfOrderResult on UpdateOrderItemsResult {
    ...NpfOrder
    ... on ErrorResult {
      errorCode
      message
    }
    ... on InsufficientStockError {
      quantityAvailable
    }
  }
`

export const ADD_ITEM_TO_ORDER_MUTATION = `
  ${ORDER_RESULT_FRAGMENT}
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ...NpfOrderResult
    }
  }
`

export const ADJUST_ORDER_LINE_MUTATION = `
  ${ORDER_RESULT_FRAGMENT}
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ...NpfOrderResult
    }
  }
`

export const REMOVE_ORDER_LINE_MUTATION = `
  ${ORDER_FRAGMENT}
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        ...NpfOrder
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const SET_SHIPPING_ADDRESS_MUTATION = `
  ${ORDER_FRAGMENT}
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        ...NpfOrder
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const SET_CUSTOMER_FOR_ORDER_MUTATION = `
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const SET_ORDER_CUSTOM_FIELDS_MUTATION = `
  mutation SetOrderCustomFields($input: UpdateOrderInput!) {
    setOrderCustomFields(input: $input) {
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const ELIGIBLE_SHIPPING_METHODS_QUERY = `
  query EligibleShippingMethods {
    eligibleShippingMethods {
      id
      code
      name
      description
      price
      priceWithTax
    }
  }
`

export const SET_SHIPPING_METHOD_MUTATION = `
  ${ORDER_FRAGMENT}
  mutation SetOrderShippingMethod($id: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $id) {
      ... on Order {
        ...NpfOrder
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const TRANSITION_ORDER_TO_STATE_MUTATION = `
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const ELIGIBLE_PAYMENT_METHODS_QUERY = `
  query EligiblePaymentMethods {
    eligiblePaymentMethods {
      id
      code
      name
      isEligible
    }
  }
`

export const ADD_PAYMENT_TO_ORDER_MUTATION = `
  ${ORDER_FRAGMENT}
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        ...NpfOrder
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

// --- Customer authentication & account -------------------------------
// Vendure's default NativeAuthenticationStrategy is active (no custom
// strategy configured in vendure-config.ts, tokenMethod includes
// 'bearer') — these are Vendure's own built-in mutations/queries, not a
// custom auth system. Same vendureRequest()/withToken() transport as the
// cart: a successful login/register returns a fresh `vendure-auth-token`
// via the same response header already handled by client.ts, so the
// existing session cookie mechanism just starts holding an authenticated
// customer's token instead of an anonymous one.

export const CUSTOMER_ORDER_LIST_FRAGMENT = `
  fragment NpfCustomerOrder on Order {
    id
    code
    state
    createdAt
    currencyCode
    totalWithTax
    lines {
      id
      quantity
      productVariant {
        id
        sku
        name
        product {
          slug
          featuredAsset { preview }
        }
      }
    }
  }
`

export const ACTIVE_CUSTOMER_QUERY = `
  ${CUSTOMER_ORDER_LIST_FRAGMENT}
  query ActiveCustomer {
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
      phoneNumber
      orders(options: { sort: { createdAt: DESC } }) {
        totalItems
        items {
          ...NpfCustomerOrder
        }
      }
    }
  }
`

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(username: $email, password: $password) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

/**
 * Email verification (F-52). Consumes the `verificationToken` from the
 * verification email; passing a password too covers Vendure's "registered
 * without a password" flow, where verification and password-setting happen in
 * one step. Only reachable when `NPF_REQUIRE_EMAIL_VERIFICATION` is on —
 * with verification disabled Vendure never issues these tokens.
 */
export const VERIFY_CUSTOMER_ACCOUNT_MUTATION = `
  mutation VerifyCustomerAccount($token: String!, $password: String) {
    verifyCustomerAccount(token: $token, password: $password) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

/**
 * Confirms an email-address change. Separate mutation from the one above on
 * purpose: `requestUpdateCustomerEmailAddress` issues its own token and only
 * `updateCustomerEmailAddress` accepts it — feeding that token to
 * `verifyCustomerAccount` fails.
 */
export const UPDATE_CUSTOMER_EMAIL_ADDRESS_MUTATION = `
  mutation UpdateCustomerEmailAddress($token: String!) {
    updateCustomerEmailAddress(token: $token) {
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

/**
 * Password recovery (F-04). Vendure's Shop API owns the token lifecycle:
 * `requestPasswordReset` mints a single-use token and hands it to the
 * EmailPlugin, and `resetPassword` consumes it. The storefront never sees or
 * stores the token — it only relays the two calls, which keeps the secret on
 * the server that issued it.
 *
 * `requestPasswordReset` intentionally resolves to the same shape whether or
 * not the address exists, so the UI cannot be used to enumerate accounts.
 */
export const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($emailAddress: String!) {
    requestPasswordReset(emailAddress: $emailAddress) {
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

/** Token arrives from the emailed link as `?token=…` (see reset-password page). */
export const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const REGISTER_CUSTOMER_ACCOUNT_MUTATION = `
  mutation RegisterCustomerAccount($input: RegisterCustomerInput!) {
    registerCustomerAccount(input: $input) {
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

// updateCustomer returns a plain Customer! (not an ErrorResult union like
// login/register) — confirmed against this Vendure version's actual
// introspected schema, not assumed. A failure here (e.g. not
// authenticated) comes back as a thrown GraphQL error, which
// vendureRequest() already turns into a VendureRequestError.
export const UPDATE_CUSTOMER_MUTATION = `
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      firstName
      lastName
    }
  }
`

// updateCustomerPassword returns the Success/ErrorResult union like the other
// auth mutations: a wrong current password arrives IN-BAND as
// InvalidCredentialsError (errorCode), not as a thrown transport error.
export const UPDATE_CUSTOMER_PASSWORD_MUTATION = `
  mutation UpdateCustomerPassword($currentPassword: String!, $newPassword: String!) {
    updateCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout {
      success
    }
  }
`

export const CUSTOMER_ADDRESSES_QUERY = `
  query ActiveCustomerAddresses {
    activeCustomer {
      id
      addresses {
        id
        fullName
        streetLine1
        city
        province
        postalCode
        phoneNumber
        defaultShippingAddress
      }
    }
  }
`

export const CREATE_CUSTOMER_ADDRESS_MUTATION = `
  mutation CreateCustomerAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      id
      fullName
      streetLine1
      city
      province
      postalCode
      phoneNumber
      defaultShippingAddress
    }
  }
`

export const DELETE_CUSTOMER_ADDRESS_MUTATION = `
  mutation DeleteCustomerAddress($id: ID!) {
    deleteCustomerAddress(id: $id) {
      success
    }
  }
`

export const PRODUCT_VARIANT_ID_BY_SLUG_QUERY = `
  query ProductVariantIdBySlug($slug: String!) {
    product(slug: $slug) {
      id
      slug
      variants {
        id
        sku
        priceWithTax
        currencyCode
      }
    }
  }
`
