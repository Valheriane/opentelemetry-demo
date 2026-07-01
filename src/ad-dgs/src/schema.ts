import { parse } from "graphql";

export const typeDefs = parse(`#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.7")

  type Query {
    ads(contextKeys: [String!]!): [Ad!]!
  }

  type Ad {
    redirectUrl: String!
    text: String!
  }
`);
