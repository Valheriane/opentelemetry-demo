import { parse } from "graphql";

export const typeDefs = parse(`#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.7", import: ["@key", "@external"])

  type Query {
    productReviews(productId: ID!): [ProductReview!]!
    averageProductReviewScore(productId: ID!): String!
    askProductAiAssistant(productId: ID!, question: String!): String!
  }

  type ProductReview {
    username: String!
    description: String!
    score: String!
  }

  extend type Product @key(fields: "id") {
    id: ID! @external
    reviews: [ProductReview!]!
    averageReviewScore: String!
    askAiAssistant(question: String!): String!
  }
`);
