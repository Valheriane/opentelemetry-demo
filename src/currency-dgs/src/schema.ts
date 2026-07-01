import { parse } from "graphql";

export const typeDefs = parse(`
  type Query {
    supportedCurrencies: [String!]!
    convertCurrency(from: MoneyInput!, toCode: String!): CurrencyMoney!
  }

  input MoneyInput {
    currencyCode: String!
    units: Int!
    nanos: Int!
  }

  type CurrencyMoney {
    currencyCode: String!
    units: Int!
    nanos: Int!
  }

  type ProductMoney {
    currencyCode: String!
    units: Int!
    nanos: Int!
  }

  extend type Product @key(fields: "id") {
    id: ID! @external
    priceUsd: ProductMoney! @external
    price(currencyCode: String!): CurrencyMoney!
      @requires(fields: "priceUsd { currencyCode units nanos }")
  }
`);