import { ChannelCredentials } from "@grpc/grpc-js";
import {
  AdServiceClient,
  type Ad as ProtoAd
} from "./protos/demo.js";

const { AD_ADDR = "ad:9555" } = process.env;

const client = new AdServiceClient(
  AD_ADDR,
  ChannelCredentials.createInsecure()
);

type Ad = {
  redirectUrl: string;
  text: string;
};

const mapAd = (ad: ProtoAd): Ad => ({
  redirectUrl: ad.redirectUrl,
  text: ad.text
});

const getAds = (contextKeys: string[]): Promise<Ad[]> => {
  return new Promise((resolve, reject) => {
    client.getAds({ contextKeys }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response.ads.map(mapAd));
    });
  });
};

export const resolvers = {
  Query: {
    ads: async (
      _parent: unknown,
      args: { contextKeys: string[] }
    ): Promise<Ad[]> => {
      return getAds(args.contextKeys);
    }
  }
};
