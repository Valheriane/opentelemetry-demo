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
`);
