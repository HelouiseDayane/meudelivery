export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  isNew: boolean;
  isPromotion: boolean;
  ingredients?: string;
  preparationTime?: string;
  allergens?: string;
}