import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileImage, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Download,
  Trash2,
  Zap,
  Brain,
  Camera,
  Calendar,
  Shield,
  Clock,
  X
} from 'lucide-react'
import { useReceiptProcessing } from '../hooks/useReceiptProcessing'
import { ExtractedProductInfo } from '../types/receipt'
import { uploadProductImage } from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface ReceiptProcessorProps {
  onProductsExtracted: (products: ExtractedProductInfo[]) => void
}

export function ReceiptProcessor({ onProductsExtracted }: ReceiptProcessorProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [productsAdded, setProductsAdded] = useState<boolean>(false)
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [productPhotoUrls, setProductPhotoUrls] = useState<{[key: number]: string}>({})
  const [productWarranties, setProductWarranties] = useState<{[key: number]: {months?: number, hasWarranty: boolean}}>({})
  const [showWarrantyInputs, setShowWarrantyInputs] = useState<Set<number>>(new Set())
  const [uploadingPhotos, setUploadingPhotos] = useState<Set<number>>(new Set())
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const { user } = useAuth()
  const { status, uploadAndProcess, processClientSide, isLoading, reset } = useReceiptProcessing()

  const clearError = useCallback(() => {
    setUploadError('')
  }, [])

  const closeModal = useCallback(() => {
    setShowUploadModal(false)
    setUploadError('')
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      try {
        setUploadError('')
        
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError('File size too large. Please select an image under 10MB.')
          return
        }
        
        setSelectedFile(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.onerror = () => {
          setUploadError('Failed to read the selected file. Please try again.')
        }
        reader.readAsDataURL(file)
        
        // Reset previous processing state
        reset()
        setSelectedProducts(new Set())
        setProductsAdded(false)
        setProductPhotoUrls({})
        setProductWarranties({})
        setShowWarrantyInputs(new Set())
        setUploadingPhotos(new Set())
        setReceiptDate(new Date().toISOString().split('T')[0])
        setUploadError('')
        setShowUploadModal(false)
        
        toast.success('Receipt image loaded successfully!')
      } catch (error) {
        console.error('File processing error:', error)
        setUploadError('Failed to process the selected file. Please try again.')
      }
    } else {
      setUploadError('Please select a valid image file (JPG, PNG, HEIC, WebP).')
    }
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: true, // Disable click to open file dialog
  })

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

    const checkCameraSupport = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false
      }
      
      // Check if camera devices are available
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      return videoDevices.length > 0
    } catch (error) {
      console.error('Camera support check failed:', error)
      return false
    }
  }, [])

  const handleCameraCapture = useCallback(async () => {
    try {
      setUploadError('')
      setShowUploadModal(false)
      
      // Show loading state
      toast('Checking camera access...', {
        icon: '📹',
        duration: 2000,
      })
      
      // First, check if we can actually access camera
      const hasCamera = await checkCameraSupport()
      
      if (!hasCamera && !isMobile()) {
        setUploadError('No camera detected on this device. Please use "Select File" to choose an image.')
        return
      }
      
      // Try to actually access the camera first (for desktop/supported browsers)
      if (!isMobile()) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          })
          
          // If we get here, camera is available - stop the stream and use file input
          stream.getTracks().forEach(track => track.stop())
          
          toast('Camera access granted! Please take your photo.', {
            icon: '✅',
            duration: 3000,
          })
        } catch (cameraError: any) {
          console.error('Camera access denied:', cameraError)
          
          if (cameraError.name === 'NotAllowedError') {
            setUploadError('Camera access denied. Please allow camera permissions in your browser and try again.')
            return
          } else if (cameraError.name === 'NotFoundError') {
            setUploadError('No camera found on this device. Please use "Select File" instead.')
            return
          } else {
            // Fall through to file input method
            console.log('Camera access failed, falling back to file input')
          }
        }
      }
      
      // Create file input with capture attribute
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      
      // Set capture attributes for mobile
      if (isMobile()) {
        input.setAttribute('capture', 'environment')
        try {
          (input as any).capture = 'environment'
        } catch (e) {
          console.log('Could not set capture property')
        }
      }
      
      let fileSelected = false
      let timeoutId: NodeJS.Timeout
      
      input.onchange = (e) => {
        fileSelected = true
        clearTimeout(timeoutId)
        
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          handleFileProcess(file)
        } else {
          setUploadError('No image was selected. Please try again.')
        }
      }
      
      input.onerror = () => {
        setUploadError('Failed to access camera. Please try "Select File" instead.')
      }
      
      // Set up timeout to detect if dialog was cancelled
      timeoutId = setTimeout(() => {
        if (!fileSelected) {
          if (isMobile()) {
            console.log('Camera capture may have been cancelled')
          } else {
            toast('💡 If file browser opened instead of camera, please select a photo or try on a mobile device for direct camera access.', {
              icon: '💡',
              duration: 6000,
            })
          }
        }
      }, 3000)
      
      // Trigger the input
      input.click()
      
    } catch (error) {
      console.error('Camera capture error:', error)
      setUploadError('Failed to access camera. Please try "Select File" to choose an image from your device.')
    }
  }, [checkCameraSupport, isMobile])

  const handleFileSelect = useCallback(() => {
    try {
      setUploadError('')
      setShowUploadModal(false)
      
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/jpg,image/png,image/heic,image/webp'
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          handleFileProcess(file)
        }
      }
      
      input.onerror = () => {
        setUploadError('Failed to access file system. Please try again.')
      }
      
      input.click()
    } catch (error) {
      console.error('File selection error:', error)
      setUploadError('Failed to open file selector. Please try again.')
    }
  }, [])

  const handleFileProcess = useCallback((file: File) => {
    try {
      setUploadError('')
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (JPG, PNG, HEIC, WebP).')
        return
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size too large. Please select an image under 10MB.')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.onerror = () => {
        setUploadError('Failed to read the selected file. Please try again.')
      }
      reader.readAsDataURL(file)
      
      // Reset previous processing state
      reset()
      setSelectedProducts(new Set())
      setProductsAdded(false)
      setProductPhotoUrls({})
      setProductWarranties({})
      setShowWarrantyInputs(new Set())
      setUploadingPhotos(new Set())
      setReceiptDate(new Date().toISOString().split('T')[0])
      setUploadError('')
      setShowUploadModal(false)
      
      toast.success('Receipt image loaded successfully!')
    } catch (error) {
      console.error('File processing error:', error)
      setUploadError('Failed to process the selected file. Please try again.')
    }
  }, [reset])



  const handleProductPhotoUpload = async (productIndex: number, file: File) => {
    if (!user) {
      toast.error('Please log in to upload product photos')
      return
    }
    
    setUploadingPhotos(prev => new Set(prev).add(productIndex))
    
    try {
      const result = await uploadProductImage(file, user.id)
      
      if (result.error) {
        toast.error(`Failed to upload photo: ${result.error}`)
        return
      }

      setProductPhotoUrls(prev => ({
        ...prev,
        [productIndex]: result.url
      }))
      
      toast.success('Product photo uploaded successfully!')
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload product photo')
    } finally {
      setUploadingPhotos(prev => {
        const newSet = new Set(prev)
        newSet.delete(productIndex)
        return newSet
      })
    }
  }

  const handleWarrantyChange = (productIndex: number, months?: number, hasWarranty: boolean = true) => {
    setProductWarranties(prev => ({
      ...prev,
      [productIndex]: { months, hasWarranty }
    }))
  }

  const toggleWarrantyInput = (productIndex: number) => {
    setShowWarrantyInputs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productIndex)) {
        newSet.delete(productIndex)
      } else {
        newSet.add(productIndex)
      }
      return newSet
    })
  }

  const calculateWarrantyExpiration = (purchaseDate: string, warrantyMonths: number): string => {
    const date = new Date(purchaseDate)
    date.setMonth(date.getMonth() + warrantyMonths)
    return date.toISOString().split('T')[0]
  }

  const handleProcess = async (useCloudProcessing = true) => {
    if (!selectedFile) return

    try {
      const result = useCloudProcessing 
        ? await uploadAndProcess(selectedFile)
        : await processClientSide(selectedFile)

      // Extract receipt date if available, otherwise use user input
      if (result.receiptDate) {
        setReceiptDate(result.receiptDate)
      }

      // Auto-select all products initially for convenience
      if (result.products.length > 0) {
        setSelectedProducts(new Set(result.products.map((_, index) => index)))
        
        // Initialize warranty settings for each product
        const warranties: {[key: number]: {months?: number, hasWarranty: boolean}} = {}
        result.products.forEach((product, index) => {
          if (product.warrantyMonths) {
            warranties[index] = { months: product.warrantyMonths, hasWarranty: true }
          } else {
            warranties[index] = { hasWarranty: false }
            setShowWarrantyInputs(prev => new Set(prev).add(index))
          }
        })
        setProductWarranties(warranties)
        
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

    const selected = Array.from(selectedProducts).map(index => {
      const product = status.result!.products[index]
      const warranty = productWarranties[index]
      const productImageUrl = productPhotoUrls[index]

      // Calculate warranty expiration if warranty is set
      let warrantyExpiresAt = undefined
      if (warranty?.hasWarranty && warranty.months) {
        warrantyExpiresAt = calculateWarrantyExpiration(receiptDate, warranty.months)
      }

      return {
        ...product,
        purchaseDate: receiptDate,
        warrantyMonths: warranty?.hasWarranty ? warranty.months : undefined,
        warrantyExpiresAt,
        productImageUrl,
        hasWarranty: warranty?.hasWarranty ?? false,
        warrantyUserInput: showWarrantyInputs.has(index)
      }
    })
    
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
    setProductPhotoUrls({})
    setProductWarranties({})
    setShowWarrantyInputs(new Set())
    setUploadingPhotos(new Set())
    setReceiptDate(new Date().toISOString().split('T')[0])
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


      {/* Upload Area */}
      {!preview ? (
        <div className="space-y-4">
          {/* Error Message */}
          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-800">Upload Error</span>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-red-700 mt-1">{uploadError}</p>
            </div>
          )}

          {/* Main Upload Button */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50 scale-105' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => setShowUploadModal(true)}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                {isDragActive ? (
                  <Download className="h-8 w-8 text-white animate-bounce" />
                ) : (
                  <Upload className="h-8 w-8 text-white" />
                )}
              </div>
              
              {isDragActive ? (
                <div>
                  <p className="text-xl font-semibold text-blue-600 mb-2">Drop your receipt here!</p>
                  <p className="text-sm text-blue-500">Release to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    Upload Receipt
                  </p>
                  <p className="text-gray-600 mb-4">
                    Drag and drop your receipt here, or click to choose how to upload
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    <Camera className="h-4 w-4 mr-2" />
                    Choose Upload Method
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-4">
                <span>📱 JPG, PNG, HEIC</span>
                <span>☁️ Max 10MB</span>
                <span>🤖 AI Ready</span>
              </div>
            </div>
          </div>

          {/* Upload Options Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Choose Upload Method</h3>
                    <button
                      onClick={closeModal}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Camera Option */}
                    <button
                      onClick={handleCameraCapture}
                      className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                        <Camera className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Use Camera</div>
                        <div className="text-sm text-gray-500">
                          {isMobile() ? 'Take a photo of your receipt' : 'Access camera to take photo'}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {isMobile() ? '📱 Direct camera access' : '💻 Camera with permission check'}
                        </div>
                        {!isMobile() && (
                          <div className="text-xs text-amber-600 mt-1">
                            ⚠️ Requires camera permissions
                          </div>
                        )}
                      </div>
                    </button>

                    {/* File Selection Option */}
                    <button
                      onClick={handleFileSelect}
                      className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                        <FileImage className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Select File</div>
                        <div className="text-sm text-gray-500">Choose from gallery or files</div>
                        <div className="text-xs text-green-600 mt-1">💻 All devices</div>
                      </div>
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 text-center">
                      <p className="font-medium mb-1">Supported formats:</p>
                      <p>JPG, PNG, HEIC, WebP • Max 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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

          {/* Receipt Date Input */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Purchase Date</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">
                {status.result?.receiptDate ? 'Detected from receipt' : 'Manual input (receipt date not detected)'}
              </span>
            </div>
          </div>

          {/* Processing Controls */}
          {status.status === 'idle' && (
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                              <button
                  onClick={() => handleProcess(true)}
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    Process Receipt
                  </span>
                </button>
                
                <button
                  onClick={() => handleProcess(false)}
                  disabled={isLoading}
                  className="btn btn-outline w-full"
                >
                  <Brain className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    Alternative Processing
                  </span>
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
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Review products, add photos, and configure warranty tracking
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
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedProducts(new Set(Array.from({length: status.result!.products.length}, (_, i) => i)))}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedProducts(new Set())}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    Total Value: ${status.result.products.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {status.result.products.map((product, index) => (
                    <div
                      key={index}
                      className={`group relative border-2 rounded-xl p-4 transition-all duration-200 ${
                        selectedProducts.has(index)
                          ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className="absolute top-3 right-3">
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                            selectedProducts.has(index)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 group-hover:border-gray-400'
                          }`}
                          onClick={() => toggleProductSelection(index)}
                        >
                          {selectedProducts.has(index) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>

                      <div className="pr-8 space-y-4">
                        {/* Product Info */}
                        <div>
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
                                <Shield className="w-4 h-4" />
                                {product.warrantyMonths} months warranty (detected)
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Brain className="w-4 h-4" />
                              {Math.round(product.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>

                                                {/* Product Photo Upload */}
                        <div className="border-t pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="h-4 w-4 text-gray-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">Product Photo (Optional)</span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleProductPhotoUpload(index, file)
                              }}
                              disabled={uploadingPhotos.has(index)}
                              className="w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                            />
                            {uploadingPhotos.has(index) && (
                              <p className="text-xs text-blue-600 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                                Uploading photo...
                              </p>
                            )}
                            {productPhotoUrls[index] && !uploadingPhotos.has(index) && (
                              <p className="text-xs text-green-600">
                                ✓ Photo uploaded successfully
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Warranty Settings */}
                        <div className="border-t pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">Warranty Tracking</span>
                          </div>
                          
                          <div className="space-y-3">
                            {/* No Warranty Option */}
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`warranty-${index}`}
                                checked={!productWarranties[index]?.hasWarranty}
                                onChange={() => handleWarrantyChange(index, undefined, false)}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">No warranty / Don't track warranty</span>
                            </label>

                            {/* Detected Warranty */}
                            {product.warrantyMonths && (
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`warranty-${index}`}
                                  checked={productWarranties[index]?.hasWarranty && productWarranties[index]?.months === product.warrantyMonths}
                                  onChange={() => handleWarrantyChange(index, product.warrantyMonths, true)}
                                  className="text-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  Use detected warranty: {product.warrantyMonths} months
                                </span>
                              </label>
                            )}

                            {/* Custom Warranty */}
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`warranty-${index}`}
                                checked={showWarrantyInputs.has(index)}
                                onChange={() => toggleWarrantyInput(index)}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">Custom warranty period</span>
                            </label>

                            {showWarrantyInputs.has(index) && (
                              <div className="ml-6 space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="Months"
                                    min="1"
                                    max="120"
                                    value={productWarranties[index]?.months || ''}
                                    onChange={(e) => handleWarrantyChange(index, parseInt(e.target.value) || undefined, true)}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-500">months</span>
                                </div>
                                {productWarranties[index]?.months && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span>Expires: {calculateWarrantyExpiration(receiptDate, productWarranties[index].months!)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-gray-600">
                    {selectedProducts.size === 0 && "Select products above to save them to your inventory"}
                    {selectedProducts.size === 1 && "1 product ready to save"}
                    {selectedProducts.size > 1 && `${selectedProducts.size} products ready to save`}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={clearAll}
                      className="btn btn-secondary w-full sm:w-auto"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={handleUseSelected}
                      disabled={selectedProducts.size === 0}
                      className={`btn w-full sm:w-auto ${
                        selectedProducts.size === 0
                          ? 'btn-secondary opacity-50 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      <span className="truncate">
                        {selectedProducts.size === 0 
                          ? 'Select Products' 
                          : selectedProducts.size === 1 
                            ? 'Save 1 Product' 
                            : `Save ${selectedProducts.size} Products`
                        }
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Products Found */}
          {status.result && status.result.products.length === 0 && status.status === 'completed' && (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products detected</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                No products could be detected in this receipt. Please try with a clearer image or add products manually.
              </p>
              <button
                onClick={clearAll}
                className="btn btn-secondary w-full sm:w-auto"
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