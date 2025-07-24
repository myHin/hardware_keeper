import { useQuery, useMutation, useQueryClient } from 'react-query'
import { supabase } from '../lib/supabase'
import { Product, CreateProductData, UpdateProductData, ProductFilters } from '../types/product'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export function useProducts(filters?: ProductFilters) {
  const { user } = useAuth()

  return useQuery(
    ['products', user?.id, filters],
    async () => {
      if (!user) return []

      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
      }

      if (filters?.expiringOnly) {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        query = query.lt('warranty_expires_at', thirtyDaysFromNow.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products')
        throw error
      }

      return data as Product[]
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function usePublicProducts() {
  return useQuery(
    ['public-products'],
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('is_public', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching public products:', error)
        toast.error('Failed to load community products')
        throw error
      }

      return data as (Product & { profiles: { full_name: string; email: string } })[]
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useCreateProduct() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation(
    async (productData: CreateProductData) => {
      if (!user) throw new Error('User not authenticated')

      // Calculate warranty expiration if warranty_months is provided
      let warranty_expires_at = null
      if (productData.warranty_months && productData.purchase_date) {
        const purchaseDate = new Date(productData.purchase_date)
        const expiryDate = new Date(purchaseDate)
        expiryDate.setMonth(expiryDate.getMonth() + productData.warranty_months)
        warranty_expires_at = expiryDate.toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            ...productData,
            user_id: user.id,
            warranty_expires_at,
            status: productData.status || 'active',
            is_public: productData.is_public || false,
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating product:', error)
        toast.error('Failed to create product')
        throw error
      }

      return data as Product
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products'])
        toast.success('Product added successfully!')
      },
    }
  )
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ id, updates }: { id: string; updates: UpdateProductData }) => {
      // Calculate warranty expiration if warranty_months is provided
      let warranty_expires_at = updates.warranty_expires_at
      if (updates.warranty_months && updates.purchase_date) {
        const purchaseDate = new Date(updates.purchase_date)
        const expiryDate = new Date(purchaseDate)
        expiryDate.setMonth(expiryDate.getMonth() + updates.warranty_months)
        warranty_expires_at = expiryDate.toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          warranty_expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating product:', error)
        toast.error('Failed to update product')
        throw error
      }

      return data as Product
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products'])
        toast.success('Product updated successfully!')
      },
    }
  )
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting product:', error)
        toast.error('Failed to delete product')
        throw error
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products'])
        toast.success('Product deleted successfully!')
      },
    }
  )
}

export function useProductStats() {
  const { user } = useAuth()

  return useQuery(
    ['product-stats', user?.id],
    async () => {
      if (!user) return null

      // Get all user products
      const { data: products, error } = await supabase
        .from('products')
        .select('status, warranty_expires_at, is_public')
        .eq('user_id', user.id)

      if (error) throw error

      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(now.getDate() + 30)

      const stats = {
        total: products?.length || 0,
        active: products?.filter(p => p.status === 'active').length || 0,
        public: products?.filter(p => p.is_public).length || 0,
        expiringSoon: products?.filter(p => {
          if (!p.warranty_expires_at) return false
          const expiryDate = new Date(p.warranty_expires_at)
          return expiryDate > now && expiryDate <= thirtyDaysFromNow
        }).length || 0,
      }

      return stats
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
    }
  )
} 