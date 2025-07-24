import { Link } from 'react-router-dom'
import { Package, Plus, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProducts, useProductStats } from '../hooks/useProducts'

export default function HomePage() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useProductStats()
  const { data: recentProducts, isLoading: productsLoading } = useProducts()

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get the 3 most recent products
  const displayProducts = recentProducts?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.user_metadata?.full_name || user?.email}!
        </h1>
        <p className="text-gray-600">
          Keep track of your hardware purchases and warranties in one place.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.total || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.active || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.expiringSoon || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Public</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.public || 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/add-product"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Add New Product</h3>
              <p className="text-sm text-gray-500">Upload receipt and track warranty</p>
            </div>
          </Link>

          <Link
            to="/products"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">View All Products</h3>
              <p className="text-sm text-gray-500">Manage your hardware inventory</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Products</h2>
          <Link to="/products" className="text-sm text-primary-600 hover:text-primary-500">
            View all
          </Link>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="space-y-4">
            {displayProducts.map((product) => {
              const daysUntilExpiry = product.warranty_expires_at 
                ? getDaysUntilExpiry(product.warranty_expires_at)
                : null
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0

              return (
                <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    {product.brand && (
                      <p className="text-sm text-gray-500">
                        {product.brand} {product.model && `• ${product.model}`}
                      </p>
                    )}
                    {product.purchase_date && (
                      <p className="text-xs text-gray-400">
                        Purchased: {new Date(product.purchase_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {daysUntilExpiry !== null ? (
                      <div className={`flex items-center text-sm ${
                        daysUntilExpiry <= 0 
                          ? 'text-red-600' 
                          : isExpiringSoon 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        <Clock className="h-4 w-4 mr-1" />
                        {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days`}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No warranty info</div>
                    )}
                    <p className="text-xs text-gray-400">warranty</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">Start tracking your hardware purchases</p>
            <Link to="/add-product" className="btn btn-primary">
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 