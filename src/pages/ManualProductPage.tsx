import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  FileText,
  Loader2
} from 'lucide-react'
import { useCreateProduct } from '../hooks/useProducts'
import { CreateProductData } from '../types/product'
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

export default function ManualProductPage() {
  const navigate = useNavigate()
  const createProduct = useCreateProduct()

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
      toast.success('Product added successfully!')
      navigate('/products')
    } catch (error) {
      console.error('Error creating product:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Add Product Manually</h1>
          <p className="text-gray-600 mt-1">Enter product details to track warranty and purchase information</p>
        </div>
      </div>

      {/* Manual Product Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProduct.isLoading}
            className="btn btn-primary w-full sm:flex-1"
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
    </div>
  )
} 