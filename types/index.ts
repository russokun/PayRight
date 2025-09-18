export interface Price {
  supermarket: string;
  price: number;
  location: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  prices: Price[];
}

export interface PriceReport {
  productName: string;
  price: number;
  supermarket: string;
  location: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  reportsCount: number;
  ranking: number;
}