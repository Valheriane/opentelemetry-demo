import { ChannelCredentials } from "@grpc/grpc-js";
import { CurrencyServiceClient } from "./protos/demo.js";
import type { Money } from "./protos/demo.js";

const { CURRENCY_ADDR = "currency:7001" } = process.env;

const client = new CurrencyServiceClient(
  CURRENCY_ADDR,
  ChannelCredentials.createInsecure()
);

type MoneyInput = {
  currencyCode: string;
  units: number;
  nanos: number;
};

type ProductParent = {
  id: string;
  priceUsd: MoneyInput;
};

function getSupportedCurrenciesGrpc(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    client.getSupportedCurrencies({}, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response.currencyCodes ?? []);
    });
  });
}

function convertCurrencyGrpc(from: MoneyInput, toCode: string): Promise<Money> {
  return new Promise((resolve, reject) => {
    client.convert({ from, toCode }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function mapMoney(money: Money) {
  return {
    currencyCode: money.currencyCode,
    units: money.units,
    nanos: money.nanos
  };
}

export const resolvers = {
  Query: {
    supportedCurrencies: async () => {
      return await getSupportedCurrenciesGrpc();
    },

    convertCurrency: async (
      _parent: unknown,
      args: { from: MoneyInput; toCode: string }
    ) => {
      const convertedMoney = await convertCurrencyGrpc(args.from, args.toCode);
      return mapMoney(convertedMoney);
    }
  },

  Product: {
    price: async (
      parent: ProductParent,
      args: { currencyCode: string }
    ) => {
      const convertedMoney = await convertCurrencyGrpc(
        parent.priceUsd,
        args.currencyCode
      );

      return mapMoney(convertedMoney);
    }
  }
};
