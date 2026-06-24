import { parse } from "graphql";

export const typeDefs = parse(`#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.7", import: ["@key"])

  type Query {
    checkoutDgsStatus: String!
  }

  type Mutation {
    placeOrder(input: PlaceOrderInput!): CheckoutOrder!
  }

  input PlaceOrderInput {
    userId: String!
    userCurrency: String!
    address: CheckoutAddressInput!
    email: String!
    creditCard: CheckoutCreditCardInput!
  }

  input CheckoutAddressInput {
    streetAddress: String!
    city: String!
    state: String!
    country: String!
    zipCode: String!
  }

  input CheckoutCreditCardInput {
    creditCardNumber: String!
    creditCardCvv: Int!
    creditCardExpirationYear: Int!
    creditCardExpirationMonth: Int!
  }

  type CheckoutOrder {
    orderId: String!
    shippingTrackingId: String!
    shippingCost: CheckoutMoney
    shippingAddress: CheckoutAddress
    items: [CheckoutOrderItem!]!
  }

  type CheckoutOrderItem {
    item: CheckoutCartItem
    cost: CheckoutMoney
  }

  type CheckoutCartItem {
    productId: ID!
    quantity: Int!
    product: Product!
  }

  type CheckoutAddress {
    streetAddress: String!
    city: String!
    state: String!
    country: String!
    zipCode: String!
  }

  type CheckoutMoney {
    currencyCode: String!
    units: Int!
    nanos: Int!
  }

  type Product @key(fields: "id", resolvable: false) {
    id: ID!
  }
`);
