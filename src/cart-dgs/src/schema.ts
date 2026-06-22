import { parse } from "graphql";

export const typeDefs = parse(`
  type Query {
    cart(userId: String!): Cart!
  }

  type Mutation {
    addCartItem(userId: String!, productId: ID!, quantity: Int!): Cart!
    emptyCart(userId: String!): Cart!
  }

  type Cart {
    userId: String!
    items: [CartItem!]!
  }

  type CartItem {
    productId: ID!
    quantity: Int!
    product: Product!
  }

  type Product @key(fields: "id", resolvable: false) {
    id: ID!
  }
`);
