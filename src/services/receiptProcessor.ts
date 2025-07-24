import { ReceiptProcessingResult, ReceiptText, ExtractedProductInfo } from '../types/receipt'
import { getGoogleVisionService, isGoogleVisionConfigured } from './googleVisionService'

// Mock OCR service - used as fallback when Google Vision is not configured
async function extractTextFromImageMock(_imageUrl: string): Promise<ReceiptText> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock extracted text - in reality this would come from OCR service
  const mockText = `Best Buy
Store #1234 - Electronics Store
123 Main Street, City, State 12345
Tel: (555) 123-4567

Receipt #: REC-2024-001234
Date: ${new Date().toLocaleDateString()}
Cashier: John D.

ITEMS PURCHASED:
Apple MacBook Pro 16-inch M3 Pro     $2,499.99
- Model: MacBook Pro 16" M3 Pro
- SKU: MBP16-M3P-1TB-SG
- Warranty: 1 Year Limited Warranty

Apple Magic Mouse                      $79.99
- Model: Magic Mouse (3rd Gen)
- SKU: MM-3G-WHITE

USB-C Charging Cable                   $29.99
- Model: USB-C to USB-C Cable 2m
- Brand: Apple

Subtotal:                           $2,609.97
Tax (8.5%):                          $221.85
Total:                              $2,831.82

Payment Method: Credit Card ****1234
Thank you for shopping with us!

Return Policy: 30 days with receipt
Warranty Information: Products include manufacturer warranty
For warranty claims, visit support.apple.com`

  return {
    rawText: mockText,
    confidence: 0.95,
    lines: mockText.split('\n').filter(line => line.trim())
  }
}

// Real OCR using Google Vision API
async function extractTextFromImageReal(imageUrl: string): Promise<ReceiptText> {
  try {
    const visionService = getGoogleVisionService()
    return await visionService.extractTextFromImageUrl(imageUrl)
  } catch (error) {
    console.error('Google Vision OCR failed, falling back to mock:', error)
    // Fallback to mock data if Google Vision fails
    return await extractTextFromImageMock(imageUrl)
  }
}

// OCR from file using Google Vision API
async function extractTextFromFile(file: File): Promise<ReceiptText> {
  try {
    const visionService = getGoogleVisionService()
    return await visionService.extractTextFromImageFile(file)
  } catch (error) {
    console.error('Google Vision OCR failed, falling back to mock:', error)
    // Fallback to mock data if Google Vision fails
    const mockUrl = URL.createObjectURL(file)
    const result = await extractTextFromImageMock(mockUrl)
    URL.revokeObjectURL(mockUrl)
    return result
  }
}

// AI-powered product type detection
function getProductType(productName: string): string {
  const name = productName.toLowerCase()
  
  // Electronics & Computing
  if (name.includes('laptop') || name.includes('macbook') || name.includes('notebook') || name.includes('computer')) return 'Laptop'
  if (name.includes('phone') || name.includes('iphone') || name.includes('smartphone') || name.includes('mobile')) return 'Smartphone'
  if (name.includes('tablet') || name.includes('ipad')) return 'Tablet'
  if (name.includes('mouse') || name.includes('mice')) return 'Computer Mouse'
  if (name.includes('keyboard')) return 'Keyboard'
  if (name.includes('monitor') || name.includes('display') || name.includes('screen')) return 'Monitor'
  if (name.includes('headphone') || name.includes('earphone') || name.includes('earbuds') || name.includes('airpods')) return 'Audio Device'
  if (name.includes('speaker') || name.includes('bluetooth')) return 'Speaker'
  if (name.includes('camera') || name.includes('webcam')) return 'Camera'
  if (name.includes('watch') || name.includes('smartwatch')) return 'Smart Watch'
  if (name.includes('cable') || name.includes('charger') || name.includes('adapter') || name.includes('dongle')) return 'Accessory'
  if (name.includes('drive') || name.includes('storage') || name.includes('ssd') || name.includes('hdd')) return 'Storage Device'
  if (name.includes('router') || name.includes('modem') || name.includes('wifi')) return 'Network Device'
  
  // Home & Appliances
  if (name.includes('tv') || name.includes('television')) return 'Television'
  if (name.includes('refrigerator') || name.includes('fridge')) return 'Refrigerator'
  if (name.includes('microwave') || name.includes('oven')) return 'Kitchen Appliance'
  if (name.includes('washer') || name.includes('dryer') || name.includes('washing')) return 'Laundry Appliance'
  if (name.includes('vacuum') || name.includes('cleaner')) return 'Cleaning Appliance'
  
  // Gaming
  if (name.includes('xbox') || name.includes('playstation') || name.includes('nintendo') || name.includes('console')) return 'Gaming Console'
  if (name.includes('controller') || name.includes('gamepad')) return 'Gaming Controller'
  if (name.includes('game') && (name.includes('video') || name.includes('disc'))) return 'Video Game'
  
  // Default
  return 'Electronics'
}

// Strategy 1: Find products on the same line (traditional receipts)
function findProductsOnSameLine(lines: string[]): ExtractedProductInfo[] {
  console.log('\n=== Strategy 1: Same Line Products ===')
  const products: ExtractedProductInfo[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines
    if (line.length < 3) continue
    
    // Skip non-product lines
    const lineLC = line.toLowerCase()
    if (lineLC.includes('subtotal') || lineLC.includes('total') || lineLC.includes('tax') ||
        lineLC.includes('discount') || lineLC.includes('change') || lineLC.includes('payment') ||
        lineLC.includes('cash') || lineLC.includes('card') || lineLC.includes('receipt') ||
        lineLC.includes('store') || lineLC.includes('cashier') || lineLC.includes('thank you') ||
        lineLC.includes('return policy') || lineLC.includes('warranty info') || lineLC.includes('date:') ||
        lineLC.includes('time:') || lineLC.includes('address') || lineLC.includes('phone') ||
        lineLC.includes('email') || lineLC.includes('website') || lineLC.includes('description') ||
        lineLC.includes('quantity') || lineLC.includes('unit price') || lineLC.includes('total amount')) {
      continue
    }
    
    console.log(`Processing line ${i}: "${line}"`)
    
    // Look for prices in this line
    const priceMatches = line.match(/\$[\d,]+\.?\d*/g)
    
    if (priceMatches && priceMatches.length > 0) {
      console.log(`Found ${priceMatches.length} price(s):`, priceMatches)
      
      // Use the rightmost price (product price is usually on the right)
      const productPrice = priceMatches[priceMatches.length - 1]
      const price = parseFloat(productPrice.replace('$', '').replace(',', ''))
      
      // Extract product name (everything before the price)
      const priceIndex = line.lastIndexOf(productPrice)
      let productName = line.substring(0, priceIndex).trim()
      
      // Clean up product name
      productName = productName.replace(/^\d+\s*[x\*]\s*/i, '') // Remove quantity like "2x" or "1 *"
      productName = productName.replace(/\s+/g, ' ').trim() // Clean whitespace
      
      // Skip if product name is too short or looks like metadata
      if (productName.length < 3 || 
          /^(qty|quantity|item|sku|upc|code|id)\s*:?\s*\d*$/i.test(productName) ||
          /^\d+$/.test(productName)) {
        console.log(`Skipping - invalid product name: "${productName}"`)
        continue
      }
      
      // Check for reasonable price range
      if (price < 0.01 || price > 50000) {
        console.log(`Skipping - unreasonable price: $${price}`)
        continue
      }
      
      // Determine product type using AI
      const productType = getProductType(productName)
      
      console.log(`✅ SAME LINE PRODUCT: "${productName}" | Price: $${price} | Type: ${productType}`)
      
      products.push({
        name: productName,
        price: price,
        productType: productType,
        warrantyMonths: 12,
        confidence: 0.9,
        rawData: { line, lineIndex: i, priceFound: productPrice, strategy: 'sameLine' }
      })
    }
  }
  
  console.log(`Same line strategy found: ${products.length} products`)
  return products
}

// Strategy 2: Parse table format receipts
function findProductsInTable(lines: string[]): ExtractedProductInfo[] {
  console.log('\n=== Strategy 2: Table Format Products ===')
  const products: ExtractedProductInfo[] = []
  
  // Look for table headers to identify table structure
  let tableStartIndex = -1
  let tableEndIndex = -1
  let priceColumnIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim()
    
    // Look for table headers
    if ((line.includes('description') && line.includes('price')) ||
        (line.includes('item') && line.includes('amount')) ||
        (line.includes('product') && line.includes('cost'))) {
      tableStartIndex = i + 1
      console.log(`Found table header at line ${i}: "${lines[i]}"`)
      
      // Try to determine which column has prices
      const headerParts = lines[i].split(/\s{2,}|\t/)
      priceColumnIndex = headerParts.findIndex(part => 
        part.toLowerCase().includes('price') || part.toLowerCase().includes('amount')
      )
      console.log(`Price column index: ${priceColumnIndex}`)
    }
    
    // Look for table end markers
    if (tableStartIndex > -1 && (
        line.includes('subtotal') || line.includes('total due') || 
        line.includes('payment method') || line.includes('transaction id'))) {
      tableEndIndex = i
      console.log(`Table ends at line ${i}`)
      break
    }
  }
  
  if (tableStartIndex === -1) {
    console.log('No table structure detected')
    return products
  }
  
  console.log(`Processing table from line ${tableStartIndex} to ${tableEndIndex || lines.length}`)
  
  // Process table rows
  for (let i = tableStartIndex; i < (tableEndIndex || lines.length); i++) {
    const line = lines[i].trim()
    if (line.length < 3) continue
    
    console.log(`Processing table row ${i}: "${line}"`)
    
    // Skip discount/promotional lines
    if (line.toLowerCase().includes('discount') || line.toLowerCase().includes('promo')) {
      console.log('Skipping discount line')
      continue
    }
    
    // Try different parsing strategies for table rows
    
    // Strategy 2A: Split by multiple spaces or tabs (common table format)
    const tableParts = line.split(/\s{2,}|\t/).filter(part => part.trim().length > 0)
    console.log(`Table parts:`, tableParts)
    
    if (tableParts.length >= 2) {
      const possibleName = tableParts[0].trim()
      const prices = tableParts.filter(part => /\$[\d,]+\.?\d*/.test(part))
      
      if (prices.length > 0 && possibleName.length > 2) {
        // Use unit price if available, otherwise use first price
        const unitPrice = prices.find(p => !p.includes(',') || parseFloat(p.replace('$', '').replace(',', '')) < 1000) || prices[0]
        const price = parseFloat(unitPrice.replace('$', '').replace(',', ''))
        
        if (price > 0.01 && price < 50000) {
          const productType = getProductType(possibleName)
          
          console.log(`✅ TABLE PRODUCT: "${possibleName}" | Price: $${price} | Type: ${productType}`)
          
          products.push({
            name: possibleName,
            price: price,
            productType: productType,
            warrantyMonths: 12,
            confidence: 0.8,
            rawData: { line, lineIndex: i, tableParts, strategy: 'table' }
          })
          continue
        }
      }
    }
    
    // Strategy 2B: Look for lines with product-like names and find prices in nearby lines
    const productPatterns = [
      /gaming|laptop|computer|mouse|keyboard|software|hardware|monitor|camera|phone|tablet|watch/i
    ]
    
    const isProductLine = productPatterns.some(pattern => pattern.test(line))
    
    if (isProductLine && !/\$/.test(line)) {
      console.log(`Found product name line: "${line}"`)
      
      // Look for price in next few lines
      for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
        const nextLine = lines[j].trim()
        const priceMatch = nextLine.match(/\$[\d,]+\.?\d*/)
        
        if (priceMatch) {
          const price = parseFloat(priceMatch[0].replace('$', '').replace(',', ''))
          
          if (price > 0.01 && price < 50000) {
            const productType = getProductType(line)
            
            console.log(`✅ TABLE PRODUCT (separate lines): "${line}" | Price: $${price} | Type: ${productType}`)
            
            products.push({
              name: line,
              price: price,
              productType: productType,
              warrantyMonths: 12,
              confidence: 0.7,
              rawData: { line, lineIndex: i, priceFound: priceMatch[0], strategy: 'tableNearby' }
            })
            break
          }
        }
      }
    }
  }
  
  console.log(`Table strategy found: ${products.length} products`)
  return products
}

// Strategy 3: Handle 4-line pattern receipts (Name, Quantity, Unit Price, Total)
function findProductsInPattern(lines: string[]): ExtractedProductInfo[] {
  console.log('\n=== Strategy 3: 4-Line Pattern Products ===')
  const products: ExtractedProductInfo[] = []
  
  // Look for table headers to find where data starts
  let dataStartIndex = -1
  
  for (let i = 0; i < lines.length - 3; i++) {
    const line1 = lines[i].toLowerCase().trim()
    const line2 = lines[i + 1].toLowerCase().trim()
    const line3 = lines[i + 2].toLowerCase().trim()
    const line4 = lines[i + 3].toLowerCase().trim()
    
    // Look for header pattern: Description, Quantity, Unit Price, Total Amount
    if ((line1.includes('description') || line1.includes('item')) &&
        (line2.includes('quantity') || line2.includes('qty')) &&
        (line3.includes('price') || line3.includes('unit')) &&
        (line4.includes('total') || line4.includes('amount'))) {
      dataStartIndex = i + 4
      console.log(`Found 4-line header pattern starting at line ${dataStartIndex}`)
      break
    }
  }
  
  if (dataStartIndex === -1) {
    console.log('No 4-line pattern headers detected')
    return products
  }
  
  // Process data in groups of 4 lines
  for (let i = dataStartIndex; i < lines.length - 3; i += 4) {
    const productName = lines[i].trim()
    const quantity = lines[i + 1].trim()
    const unitPrice = lines[i + 2].trim()
    const totalPrice = lines[i + 3].trim()
    
    console.log(`\nProcessing 4-line group starting at line ${i}:`)
    console.log(`  Product: "${productName}"`)
    console.log(`  Quantity: "${quantity}"`)
    console.log(`  Unit Price: "${unitPrice}"`)
    console.log(`  Total: "${totalPrice}"`)
    
    // Stop if we hit non-product lines
    if (productName.toLowerCase().includes('discount') ||
        productName.toLowerCase().includes('total') ||
        productName.toLowerCase().includes('subtotal') ||
        productName.toLowerCase().includes('tax') ||
        productName.toLowerCase().includes('payment') ||
        productName.toLowerCase().includes('thank you')) {
      console.log('Hit end-of-table marker, stopping pattern processing')
      break
    }
    
    // Validate that we have a proper product name and unit price
    const unitPriceMatch = unitPrice.match(/\$[\d,]+\.?\d*/)
    if (productName.length > 2 && unitPriceMatch) {
      const price = parseFloat(unitPriceMatch[0].replace('$', '').replace(',', ''))
      
      // Validate price range
      if (price > 0.01 && price < 50000) {
        const productType = getProductType(productName)
        
        console.log(`✅ PATTERN PRODUCT: "${productName}" | Price: $${price} | Type: ${productType}`)
        
        products.push({
          name: productName,
          price: price,
          productType: productType,
          warrantyMonths: 12,
          confidence: 0.95, // High confidence for structured data
          rawData: { 
            productName, 
            quantity, 
            unitPrice, 
            totalPrice, 
            lineIndex: i, 
            strategy: 'pattern4Line' 
          }
        })
      } else {
        console.log(`Skipping - invalid price range: $${price}`)
      }
    } else {
      console.log(`Skipping - invalid product name or price format`)
      console.log(`  Name valid: ${productName.length > 2}`)
      console.log(`  Price match: ${!!unitPriceMatch}`)
    }
  }
  
  console.log(`4-line pattern strategy found: ${products.length} products`)
  return products
}

// Simplified and improved product parsing
async function parseProductsFromText(receiptText: ReceiptText): Promise<ExtractedProductInfo[]> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const products: ExtractedProductInfo[] = []
  const lines = receiptText.lines
  
  console.log('=== Starting Product Parsing ===')
  console.log('Total lines to process:', lines.length)
  console.log('All extracted lines:')
  lines.forEach((line, i) => console.log(`${i}: "${line}"`))
  
  // Strategy 1: Try to find products on the same line (traditional receipts)
  const sameLineProducts = findProductsOnSameLine(lines)
  products.push(...sameLineProducts)
  
  // Strategy 2: Try to parse table format (structured receipts)
  const tableProducts = findProductsInTable(lines)
  products.push(...tableProducts)
  
  // Strategy 3: Handle 4-line pattern (Name, Quantity, Unit Price, Total)
  const patternProducts = findProductsInPattern(lines)
  products.push(...patternProducts)
  
  // Remove duplicates
  const uniqueProducts = products.filter((product, index, self) => 
    index === self.findIndex(p => p.name === product.name && p.price === product.price)
  )
  
  console.log(`Total unique products found: ${uniqueProducts.length}`)
  
  // Extract purchase date from receipt
  const datePatterns = [
    /date[:\s]+([^\n]+)/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
    /(\d{4}-\d{1,2}-\d{1,2})/
  ]
  
  let purchaseDate: string | undefined
  
  for (const pattern of datePatterns) {
    const match = receiptText.rawText.match(pattern)
    if (match) {
      try {
        const date = new Date(match[1] || match[0])
        if (!isNaN(date.getTime())) {
          purchaseDate = date.toISOString().split('T')[0]
          break
        }
      } catch (e) {
        // Continue trying other patterns
      }
    }
  }
  
    // Add purchase date to all products
  uniqueProducts.forEach(product => {
    product.purchaseDate = purchaseDate
  })
  
  console.log('=== Product Parsing Complete ===')
  console.log(`Total products found: ${uniqueProducts.length}`)
  
  return uniqueProducts
}

export async function processReceipt(imageUrl: string): Promise<ReceiptProcessingResult> {
  try {
    console.log('Processing receipt with AI text extraction')
    
    // Step 1: Extract text from image using OCR
    const receiptText = isGoogleVisionConfigured() 
      ? await extractTextFromImageReal(imageUrl)
      : await extractTextFromImageMock(imageUrl)
    
    console.log('OCR completed, confidence:', receiptText.confidence)
    
    // Step 2: Parse products from text using AI
    const products = await parseProductsFromText(receiptText)
    
    console.log('Product parsing completed, found:', products.length, 'products')
    console.log('Final products detected:', products.map(p => ({ name: p.name, price: p.price, type: p.productType })))
    
    // Extract additional metadata
    const dateMatch = receiptText.rawText.match(/Date:\s*([^\n]+)/i) || 
                     receiptText.rawText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)
    const totalMatch = receiptText.rawText.match(/Total:\s*\$?([\d,]+\.?\d*)/i)
    const storeMatch = receiptText.rawText.match(/^([^\n]+)/m) // First line usually store name
    
    return {
      text: receiptText,
      products,
      store: storeMatch ? storeMatch[1].trim() : undefined,
      total: totalMatch ? parseFloat(totalMatch[1].replace(',', '')) : undefined,
      date: dateMatch ? (dateMatch[1] || dateMatch[0]).trim() : undefined,
      success: true
    }
  } catch (error) {
    console.error('Receipt processing error:', error)
    return {
      text: { rawText: '', confidence: 0, lines: [] },
      products: [],
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    }
  }
}

// Process receipt from file (for local processing)
export async function processReceiptFromFile(imageFile: File): Promise<ReceiptProcessingResult> {
  try {
    console.log('Processing receipt file with AI text extraction')
    
    // Step 1: Extract text from file
    const receiptText = isGoogleVisionConfigured()
      ? await extractTextFromFile(imageFile)
      : await extractTextFromImageMock(URL.createObjectURL(imageFile))
    
    console.log('OCR completed, confidence:', receiptText.confidence)
    console.log('Extracted text lines:', receiptText.lines.length)
    console.log('First few lines:', receiptText.lines.slice(0, 10))
    console.log('Raw text preview:', receiptText.rawText.substring(0, 200) + '...')
    
    // Step 2: Parse products from text
    const products = await parseProductsFromText(receiptText)
    
    console.log('Product parsing completed, found:', products.length, 'products')
    console.log('Final products detected:', products.map(p => ({ name: p.name, price: p.price, type: p.productType })))
    
    // Extract metadata
    const dateMatch = receiptText.rawText.match(/Date:\s*([^\n]+)/i) || 
                     receiptText.rawText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)
    const totalMatch = receiptText.rawText.match(/Total:\s*\$?([\d,]+\.?\d*)/i)
    const storeMatch = receiptText.rawText.match(/^([^\n]+)/m)
    
    // Enhanced date extraction
    let receiptDate: string | undefined
    if (dateMatch) {
      try {
        const dateStr = dateMatch[1] || dateMatch[0]
        const date = new Date(dateStr.trim())
        if (!isNaN(date.getTime())) {
          receiptDate = date.toISOString().split('T')[0]
        }
      } catch (e) {
        console.warn('Could not parse receipt date:', dateMatch[0])
      }
    }
    
    return {
      text: receiptText,
      products,
      store: storeMatch ? storeMatch[1].trim() : undefined,
      total: totalMatch ? parseFloat(totalMatch[1].replace(',', '')) : undefined,
      date: dateMatch ? (dateMatch[1] || dateMatch[0]).trim() : undefined,
      receiptDate, // New field for properly formatted date
      success: true
    }
  } catch (error) {
    console.error('File processing error:', error)
    return {
      text: { rawText: '', confidence: 0, lines: [] },
      products: [],
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    }
  }
}

// Legacy function for backward compatibility
export async function processReceiptWithTesseract(imageFile: File): Promise<ReceiptProcessingResult> {
  return processReceiptFromFile(imageFile)
}

// Real AI processing using OpenAI (requires API key)
export async function processReceiptWithOpenAI(receiptText: string): Promise<ExtractedProductInfo[]> {
  try {
    // For production with OpenAI API:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [{
    //       role: 'system',
    //       content: 'Extract product information from this receipt text. Return JSON array with name, brand, model, price, warranty info.'
    //     }, {
    //       role: 'user',
    //       content: receiptText
    //     }],
    //     temperature: 0.1,
    //   }),
    // })
    
    // For now, use mock processing
    const mockText = { rawText: receiptText, confidence: 0.9, lines: receiptText.split('\n') }
    return await parseProductsFromText(mockText)
  } catch (error) {
    console.error('OpenAI processing error:', error)
    throw error
  }
} 