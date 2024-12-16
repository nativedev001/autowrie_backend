declare module 'google-search-results-nodejs' {
    export class GoogleSearch {
      constructor(apiKey: string);
      json(params: object, callback: (data: object) => void): void;
      html(params: object, callback: (data: string) => void): void;
      locations(q: string, callback: (data: object) => void): void;
    }
  }
  