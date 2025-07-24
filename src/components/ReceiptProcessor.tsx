import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileImage, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Trash2,
  Zap,
  Brain,
  Settings
} from 'lucide-react'
import { useReceiptProcessing } from '../hooks/useReceiptProcessing'
import { ExtractedProductInfo } from '../types/receipt'
import toast from 'react-hot-toast'

interface ReceiptProcessorProps {
  onProductsExtracted: (products: ExtractedProductInfo[]) => void
  onReceiptUploaded?: (url: string) => void
}

export function ReceiptProcessor({ onProductsExtracted, onReceiptUploaded }: ReceiptProcessorProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [productsAdded, setProductsAdded] = useState<boolean>(false)
  const { status, uploadAndProcess, processClientSide, isLoading, isGoogleVisionEnabled, reset } = useReceiptProcessing()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Reset previous processing state
      reset()
      setSelectedProducts(new Set())
      setProductsAdded(false)
    }
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleProcess = async (useCloudProcessing = true) => {
    if (!selectedFile) return

    try {
      const result = useCloudProcessing 
        ? await uploadAndProcess(selectedFile)
        : await processClientSide(selectedFile)

      // Note: Not uploading to storage in this simplified version
      // if (result.receiptUrl && onReceiptUploaded) {
      //   onReceiptUploaded(result.receiptUrl)
      // }

      // Auto-select all products initially for convenience
      if (result.products.length > 0) {
        setSelectedProducts(new Set(result.products.map((_, index) => index)))
        toast.success(
          `Found ${result.products.length} products! All are pre-selected for your convenience.`,
          {
            duration: 3000,
            icon: '🎉',
          }
        )
      }
    } catch (error) {
      console.error('Processing error:', error)
    }
  }

  const handleUseSelected = () => {
    if (!status.result) return

    const selected = Array.from(selectedProducts).map(index => status.result!.products[index])
    onProductsExtracted(selected)
    
    // Show success message
    const count = selectedProducts.size
    toast.success(
      count === 1 
        ? `Successfully saved 1 product to your inventory!` 
        : `Successfully saved ${count} products to your inventory!`,
      {
        duration: 4000,
        icon: '✅',
      }
    )
    
    // Mark products as added and clear selection after success
    setProductsAdded(true)
    setTimeout(() => {
      setSelectedProducts(new Set())
    }, 1000)
  }

  const toggleProductSelection = (index: number) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedProducts(newSelected)
  }

  const clearAll = () => {
    setPreview(null)
    setSelectedFile(null)
    setSelectedProducts(new Set())
    setProductsAdded(false)
    reset()
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'processing': 
      case 'uploading': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Google Vision Status */}
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
        isGoogleVisionEnabled 
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
      }`}>
        <Settings className="h-4 w-4" />
        <span>
          {isGoogleVisionEnabled 
            ? '🟢 Google Vision API enabled - Real OCR processing'
            : '🟡 Using mock OCR - Add VITE_GOOGLE_VISION_API_KEY for real processing'
          }
        </span>
      </div>

      {/* Upload Area */}
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600 mb-2">Drop your receipt here!</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload receipt image
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop or click to select
              </p>
            </>
          )}
          
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>📱 JPG, PNG, HEIC</span>
            <span>•</span>
            <span>☁️ Max 10MB</span>
            <span>•</span>
            <span>{isGoogleVisionEnabled ? '🤖 Google Vision Ready' : '🧪 Mock Processing'}</span>
          </div>
        </div>
      ) : (
        /* Preview and Processing */
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Receipt Preview</span>
                {isGoogleVisionEnabled && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Google Vision Ready
                  </span>
                )}
              </div>
              <button
                onClick={clearAll}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove receipt"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="relative">
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-64 mx-auto rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* Processing Controls */}
          {status.status === 'idle' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleProcess(true)}
                disabled={isLoading}
                className="btn btn-primary flex items-center justify-center"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isGoogleVisionEnabled ? 'Process with Google Vision' : 'Process with Mock AI'}
              </button>
              
              <button
                onClick={() => handleProcess(false)}
                disabled={isLoading}
                className="btn btn-outline flex items-center justify-center"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isGoogleVisionEnabled ? 'Alternative Processing' : 'Alternative Mock Processing'}
              </button>
            </div>
          )}

          {/* Processing Status */}
          {(status.status !== 'idle') && (
            <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
              <div className="flex items-center gap-3">
                {status.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                ) : status.status === 'error' ? (
                  <XCircle className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
                )}
                
                <div className="flex-1">
                  <p className="font-medium">{status.message}</p>
                  
                  {(status.status === 'uploading' || status.status === 'processing') && (
                    <div className="mt-2">
                      <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-current transition-all duration-300"
                          style={{ width: `${status.progress}%` }}
                        />
                      </div>
                      <p className="text-xs mt-1 opacity-75">{status.progress}% complete</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Success State */}
              {productsAdded && (
                <div className="px-6 py-4 bg-green-50 border-t border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Products successfully saved to your inventory!
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Check your Products page to see them, or upload a new receipt to add more.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extracted Products */}
          {status.result && status.result.products.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      {status.result.products.length} Products Detected
                      {isGoogleVisionEnabled && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                          Google Vision AI
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Review and select which products to add to your inventory
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {selectedProducts.size} of {status.result.products.length} selected
                    </div>
                    <div className="text-xs text-gray-500">
                      Click products to select/deselect
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProducts(new Set(Array.from({length: status.result!.products.length}, (_, i) => i)))}
                      className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedProducts(new Set())}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Total Value: ${status.result.products.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-6">
                <div className="grid gap-3">
                  {status.result.products.map((product, index) => (
                    <div
                      key={index}
                      className={`group relative border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                        selectedProducts.has(index)
                          ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => toggleProductSelection(index)}
                    >
                      {/* Selection Indicator */}
                      <div className="absolute top-3 right-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedProducts.has(index)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                          {selectedProducts.has(index) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>

                      <div className="pr-8">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-lg leading-tight">
                            {product.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          {product.productType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {product.productType}
                            </span>
                          )}
                          {product.price && (
                            <span className="text-xl font-bold text-green-600">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {product.warrantyMonths && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {product.warrantyMonths} months warranty
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {Math.round(product.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedProducts.size === 0 && "Select products above to save them to your inventory"}
                    {selectedProducts.size === 1 && "1 product ready to save"}
                    {selectedProducts.size > 1 && `${selectedProducts.size} products ready to save`}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={clearAll}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={handleUseSelected}
                      disabled={selectedProducts.size === 0}
                      className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                        selectedProducts.size === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {selectedProducts.size === 0 
                        ? 'Select Products' 
                        : selectedProducts.size === 1 
                          ? 'Save 1 Product' 
                          : `Save ${selectedProducts.size} Products`
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Products Found */}
          {status.result && status.result.products.length === 0 && status.status === 'completed' && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products detected</h3>
              <p className="text-gray-600 mb-4">
                {isGoogleVisionEnabled 
                  ? "Google Vision couldn't identify any products in this receipt."
                  : "The mock AI couldn't identify any products. Try enabling Google Vision API."
                }
              </p>
              <button
                onClick={clearAll}
                className="btn btn-secondary"
              >
                Try Another Receipt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 