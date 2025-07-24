export interface ReceiptText {
  rawText: string
  confidence: number
  lines: string[]
}

export interface ExtractedProductInfo {
  name?: string
  price?: number
  productType?: string
  purchaseDate?: string
  warrantyMonths?: number
  warrantyExpiresAt?: string
  store?: string
  confidence: number
  rawData: any
  productImageUrl?: string // New field for product photo
  hasWarranty?: boolean // Track if warranty is applicable
  warrantyUserInput?: boolean // Track if warranty was user-provided
}

export interface ReceiptProcessingResult {
  text: ReceiptText
  products: ExtractedProductInfo[]
  store?: string
  total?: number
  date?: string
  receiptDate?: string // New field for extracted receipt date
  success: boolean
  error?: string
  receiptUrl?: string
  receiptPath?: string
}

export interface ReceiptProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  result?: ReceiptProcessingResult
} 