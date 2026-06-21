import { parse } from "graphql";

export const typeDefs = parse(`
  type Query {
    products: [Product!]!
    product(id: ID!): Product!
  }

  type Product @key(fields: "id") {
    id: ID!
    name: String!
    description: String!
    picture: String!
    priceUsd: ProductMoney!
    categories: [String!]!
  }

  type ProductMoney {
    currencyCode: String!
    units: Int!
    nanos: Int!
  }
`);
