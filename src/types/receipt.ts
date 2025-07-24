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
  store?: string
  confidence: number
  rawData: any
}

export interface ReceiptProcessingResult {
  text: ReceiptText
  products: ExtractedProductInfo[]
  store?: string
  total?: number
  date?: string
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