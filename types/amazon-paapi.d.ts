declare module 'amazon-paapi' {
  interface CommonParameters {
    AccessKey: string;
    SecretKey: string;
    PartnerTag: string;
    PartnerType: string;
    Marketplace: string;
  }

  interface SearchItemsParameters {
    Keywords: string;
    SearchIndex: string;
    ItemCount: number;
    Resources: string[];
  }

  interface SearchResult {
    SearchResult?: {
      Items?: any[];
    };
  }

  function SearchItems(
    commonParameters: CommonParameters,
    requestParameters: SearchItemsParameters
  ): Promise<SearchResult>;

  export default {
    SearchItems,
  };
}
