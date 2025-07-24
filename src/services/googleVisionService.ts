import { ReceiptText } from '../types/receipt'

// Google Vision API service for real OCR
export class GoogleVisionService {
  private apiKey: string
  private apiUrl = 'https://vision.googleapis.com/v1/images:annotate'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async extractTextFromImage(imageBase64: string): Promise<ReceiptText> {
    try {
      const requestBody = {
        requests: [
          {
            image: {
              content: imageBase64
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      }

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.responses?.[0]?.error) {
        throw new Error(`Google Vision API error: ${data.responses[0].error.message}`)
      }

      const textAnnotations = data.responses?.[0]?.textAnnotations
      
      if (!textAnnotations || textAnnotations.length === 0) {
        return {
          rawText: '',
          confidence: 0,
          lines: []
        }
      }

      // First annotation contains the full text
      const fullText = textAnnotations[0]?.description || ''
      const confidence = textAnnotations[0]?.confidence || 0.8

      // Split into lines and filter out empty lines
      const lines = fullText.split('\n').filter((line: string) => line.trim().length > 0)

      return {
        rawText: fullText,
        confidence: confidence,
        lines: lines
      }

    } catch (error) {
      console.error('Google Vision OCR error:', error)
      throw new Error(
        error instanceof Error 
          ? `OCR failed: ${error.message}` 
          : 'OCR processing failed'
      )
    }
  }

  async extractTextFromImageFile(file: File): Promise<ReceiptText> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file)
      
      // Remove data URL prefix if present
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
      
      return await this.extractTextFromImage(base64Data)
    } catch (error) {
      console.error('File processing error:', error)
      throw new Error('Failed to process image file')
    }
  }

  async extractTextFromImageUrl(imageUrl: string): Promise<ReceiptText> {
    try {
      // Fetch image and convert to base64
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const blob = await response.blob()
      const base64 = await this.blobToBase64(blob)
      const base64Data = base64.split(',')[1] // Remove data URL prefix

      return await this.extractTextFromImage(base64Data)
    } catch (error) {
      console.error('URL processing error:', error)
      throw new Error('Failed to process image from URL')
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Test method to verify API connection
  async testConnection(): Promise<boolean> {
    try {
      // Create a simple test image (1x1 pixel white PNG in base64)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      
      await this.extractTextFromImage(testImageBase64)
      return true
    } catch (error) {
      console.error('Google Vision API connection test failed:', error)
      return false
    }
  }
}

// Singleton instance
let visionService: GoogleVisionService | null = null

export function getGoogleVisionService(): GoogleVisionService {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Vision API key not configured. Please set VITE_GOOGLE_VISION_API_KEY in your .env file.')
  }

  if (!visionService) {
    visionService = new GoogleVisionService(apiKey)
  }

  return visionService
}

// Utility function to check if Google Vision is configured
export function isGoogleVisionConfigured(): boolean {
  return !!import.meta.env.VITE_GOOGLE_VISION_API_KEY
} 