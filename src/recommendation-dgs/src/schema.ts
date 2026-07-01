import { parse } from "graphql";

export const typeDefs = parse(`#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.7", import: ["@key"])

  type Query {
    recommendedProductIds(
      userId: String!
      productIds: [ID!]!
      limit: Int = 4
    ): [ID!]!

    recommendedProducts(
      userId: String!
      productIds: [ID!]!
      limit: Int = 4
    ): [Product!]!
  }

  type Product @key(fields: "id", resolvable: false) {
    id: ID!
  }
`);
