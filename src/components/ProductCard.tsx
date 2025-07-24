import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Package, 
  Calendar, 
  Clock, 
  DollarSign, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle 
} from 'lucide-react'
import { Product } from '../types/product'
import { useUpdateProduct, useDeleteProduct } from '../hooks/useProducts'

interface ProductCardProps {
  product: Product
  showActions?: boolean
  compact?: boolean
}

export function ProductCard({ product, showActions = true, compact = false }: ProductCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getWarrantyStatus = () => {
    if (!product.warranty_expires_at) return null
    
    const now = new Date()
    const expiryDate = new Date(product.warranty_expires_at)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', message: 'Expired', color: 'text-red-600 bg-red-50' }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', message: `${daysUntilExpiry} days left`, color: 'text-yellow-600 bg-yellow-50' }
    } else {
      return { status: 'active', message: `${daysUntilExpiry} days left`, color: 'text-green-600 bg-green-50' }
    }
  }

  const getStatusIcon = () => {
    switch (product.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'discontinued':
        return <XCircle className="h-4 w-4 text-gray-600" />
      case 'broken':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'sold':
        return <DollarSign className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const warrantyStatus = getWarrantyStatus()

  const handleTogglePublic = async () => {
    await updateProduct.mutateAsync({
      id: product.id,
      updates: { is_public: !product.is_public }
    })
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(product.id)
    }
  }

  const handleStatusChange = async (newStatus: Product['status']) => {
    const reason = newStatus !== 'active' 
      ? prompt(`Why are you marking this product as ${newStatus}?`)
      : null

    if (newStatus !== 'active' && !reason) return

         await updateProduct.mutateAsync({
       id: product.id,
       updates: { 
         status: newStatus,
         discontinue_reason: reason || undefined
       }
     })
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon()}
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {product.name}
            </h3>
            {product.is_public && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Public
              </span>
            )}
          </div>
          
          {product.brand && (
            <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {product.brand} {product.model && `• ${product.model}`}
            </p>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleTogglePublic}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={product.is_public ? 'Make private' : 'Make public'}
            >
              {product.is_public ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
            
            <Link
              to={`/products/${product.id}/edit`}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit product"
            >
              <Edit className="h-4 w-4" />
            </Link>
            
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Warranty Status */}
      {warrantyStatus && (
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-3 ${warrantyStatus.color}`}>
          <Clock className="h-3 w-3 mr-1" />
          {warrantyStatus.message}
        </div>
      )}

      {/* Quick Info */}
      <div className={`grid grid-cols-2 gap-4 text-sm ${compact ? 'text-xs' : ''}`}>
        {product.purchase_date && (
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Purchased {formatDate(product.purchase_date)}</span>
          </div>
        )}
        
        {product.purchase_price && (
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">${product.purchase_price}</span>
          </div>
        )}
      </div>

      {/* Details Toggle */}
      {!compact && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      )}

      {/* Expanded Details */}
      {showDetails && !compact && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {product.warranty_months && (
            <div className="text-sm text-gray-600">
              <strong>Warranty:</strong> {product.warranty_months} months 
              {product.warranty_expires_at && ` (expires ${formatDate(product.warranty_expires_at)})`}
            </div>
          )}
          
          {product.notes && (
            <div className="text-sm text-gray-600">
              <strong>Notes:</strong> {product.notes}
            </div>
          )}
          
          {product.discontinue_reason && (
            <div className="text-sm text-gray-600">
              <strong>Reason:</strong> {product.discontinue_reason}
            </div>
          )}

          {/* Status Change Actions */}
          {showActions && product.status === 'active' && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleStatusChange('discontinued')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Mark as Discontinued
              </button>
              <button
                onClick={() => handleStatusChange('broken')}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Mark as Broken
              </button>
              <button
                onClick={() => handleStatusChange('sold')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Mark as Sold
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 