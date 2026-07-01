import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Money {
    currencyCode: String!
    units: Int!
    nanos: Int!
  }

  input AddressInput {
    streetAddress: String!
    city: String!
    state: String!
    country: String!
    zipCode: String!
  }

  input CartItemInput {
    productId: ID!
    quantity: Int!
  }

  type Query {
    shippingQuoteUsd(address: AddressInput!, items: [CartItemInput!]!): Money!
  }
`;