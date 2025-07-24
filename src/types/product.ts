export type ProductStatus = 'active' | 'discontinued' | 'broken' | 'sold'

export interface Product {
  id: string
  user_id: string
  name: string
  brand: string | null
  model: string | null
  purchase_date: string | null
  warranty_months: number | null
  warranty_expires_at: string | null
  purchase_price: number | null
  receipt_image_url: string | null
  status: ProductStatus
  discontinue_reason: string | null
  is_public: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateProductData {
  name: string
  brand?: string
  model?: string
  purchase_date?: string
  warranty_months?: number
  purchase_price?: number
  status?: ProductStatus
  is_public?: boolean
  notes?: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  discontinue_reason?: string
  warranty_expires_at?: string
}

export interface ProductFilters {
  status?: ProductStatus
  search?: string
  expiringOnly?: boolean
} 