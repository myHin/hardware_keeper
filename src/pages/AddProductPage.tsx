
import { useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Package, 
  Wand2
} from 'lucide-react'
import { useCreateProduct } from '../hooks/useProducts'
import { CreateProductData } from '../types/product'
import { ReceiptProcessor } from '../components/ReceiptProcessor'
import { ExtractedProductInfo } from '../types/receipt'
import toast from 'react-hot-toast'



export default function AddProductPage() {
  const navigate = useNavigate()
  const createProduct = useCreateProduct()


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
        </div>
      </div>

      {/* Main Feature - AI Receipt Processing */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-8">
        <div className="text-center mb-6">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
        </div>
        
                  <ReceiptProcessor 
            onProductsExtracted={handleProductsExtracted}
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
        
        <Link
          to="/add-manual"
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Package className="h-4 w-4 mr-2" />
          Add Single Product Manually
        </Link>
      </div>


    </div>
  )
} 