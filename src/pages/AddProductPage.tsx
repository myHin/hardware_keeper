import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  FileText,
  Loader2,
  Wand2
} from 'lucide-react'
import { useCreateProduct } from '../hooks/useProducts'
import { CreateProductData } from '../types/product'
import { ReceiptProcessor } from '../components/ReceiptProcessor'
import { ExtractedProductInfo } from '../types/receipt'
import toast from 'react-hot-toast'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().optional(),
  model: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_months: z.number().min(0).max(240).optional(),
  purchase_price: z.number().min(0).optional(),
  notes: z.string().optional(),
  is_public: z.boolean().default(false),
})

type ProductFormData = z.infer<typeof productSchema>

export default function AddProductPage() {
  const navigate = useNavigate()
  const createProduct = useCreateProduct()
  const [receiptUrl, setReceiptUrl] = useState<string>('')
  const [showManualEntry, setShowManualEntry] = useState(false)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_public: false,
    }
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      const productData: CreateProductData = {
        name: data.name,
        brand: data.brand || undefined,
        model: data.model || undefined,
        purchase_date: data.purchase_date || undefined,
        warranty_months: data.warranty_months || undefined,
        purchase_price: data.purchase_price || undefined,
        notes: data.notes || undefined,
        is_public: data.is_public,
      }

      await createProduct.mutateAsync(productData)
      navigate('/products')
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleProductsExtracted = async (products: ExtractedProductInfo[]) => {
    if (products.length === 0) return

    try {
      console.log(`Saving ${products.length} products to database...`)
      
      // Save all products to database
      const savedProducts = []
      for (const product of products) {
        const productData: CreateProductData = {
          name: product.name || 'Unknown Product',
          purchase_price: product.price || undefined,
          warranty_months: product.warrantyMonths || undefined,
          purchase_date: product.purchaseDate || undefined,
          notes: product.productType ? `Product Type: ${product.productType}` : undefined,
          is_public: false,
        }

        const saved = await createProduct.mutateAsync(productData)
        savedProducts.push(saved)
      }

      console.log(`Successfully saved ${savedProducts.length} products`)
      
      // Show success and navigate
      toast.success(
        `🎉 Successfully added ${savedProducts.length} products to your inventory!`,
        { duration: 5000 }
      )
      
      // Navigate to products page to see the new items
      setTimeout(() => {
        navigate('/products')
      }, 2000)
      
    } catch (error) {
      console.error('Error saving products:', error)
      toast.error('Failed to save some products. Please try again.')
    }
  }

  const calculateExpiryDate = () => {
    const purchaseDate = form.watch('purchase_date')
    const warrantyMonths = form.watch('warranty_months')
    
    if (purchaseDate && warrantyMonths) {
      const purchase = new Date(purchaseDate)
      const expiry = new Date(purchase)
      expiry.setMonth(expiry.getMonth() + warrantyMonths)
      return expiry.toLocaleDateString()
    }
    return null
  }

  const expiryDate = calculateExpiryDate()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Add New Products</h1>
          <p className="text-gray-600 mt-1">Upload a receipt and let AI automatically extract your products</p>
        </div>
      </div>

      {/* Main Feature - AI Receipt Processing */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-8">
        <div className="text-center mb-6">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Receipt Processing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simply upload a photo of your receipt and our AI will automatically extract all products, 
            prices, and warranty information. No manual typing required!
          </p>
        </div>
        
        <ReceiptProcessor 
          onProductsExtracted={handleProductsExtracted}
          onReceiptUploaded={setReceiptUrl}
        />
      </div>

      {/* Alternative Option - Manual Entry */}
      <div className="text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 text-gray-500">or if you prefer</span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setShowManualEntry(true)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Package className="h-4 w-4 mr-2" />
          Add Single Product Manually
        </button>
      </div>

      {/* Manual Product Form */}
      {showManualEntry && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Manual Product Entry</h3>
            <button
              type="button"
              onClick={() => setShowManualEntry(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

        {/* Product Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                {...form.register('name')}
                className="input"
                placeholder="e.g., MacBook Pro 16-inch"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                {...form.register('brand')}
                className="input"
                placeholder="e.g., Apple"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                {...form.register('model')}
                className="input"
                placeholder="e.g., M3 Pro"
              />
            </div>
          </div>
        </div>

        {/* Purchase & Warranty */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Purchase & Warranty
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                {...form.register('purchase_date')}
                type="date"
                className="input"
              />
            </div>

            {/* Warranty Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty (months)
              </label>
              <input
                {...form.register('warranty_months', { valueAsNumber: true })}
                type="number"
                min="0"
                max="240"
                className="input"
                placeholder="e.g., 12"
              />
              {form.formState.errors.warranty_months && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.warranty_months.message}
                </p>
              )}
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price ($)
              </label>
              <input
                {...form.register('purchase_price', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="input"
                placeholder="e.g., 2499.99"
              />
            </div>
          </div>

          {/* Warranty Expiry Preview */}
          {expiryDate && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Warranty expires:</strong> {expiryDate}
              </p>
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Additional Details
          </h2>
          
          <div className="space-y-4">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                {...form.register('notes')}
                rows={3}
                className="input"
                placeholder="Any additional notes about this product..."
              />
            </div>

            {/* Public Sharing */}
            <div className="flex items-center">
              <input
                {...form.register('is_public')}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <label className="text-sm font-medium text-gray-700">
                  Share publicly in community
                </label>
                <p className="text-xs text-gray-500">
                  Other users can see this product in the community section
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProduct.isLoading}
            className="btn btn-primary flex-1"
          >
            {createProduct.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Product...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </>
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  )
} 