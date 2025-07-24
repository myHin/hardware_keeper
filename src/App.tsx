import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { Layout } from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import AddProductPage from './pages/AddProductPage'
import ManualProductPage from './pages/ManualProductPage'
import CommunityPage from './pages/CommunityPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Private routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <HomePage />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/products" element={
          <PrivateRoute>
            <Layout>
              <ProductsPage />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/add-product" element={
          <PrivateRoute>
            <Layout>
              <AddProductPage />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/add-manual" element={
          <PrivateRoute>
            <Layout>
              <ManualProductPage />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/community" element={
          <PrivateRoute>
            <Layout>
              <CommunityPage />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default App 