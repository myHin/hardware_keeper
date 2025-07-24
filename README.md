# Hardware Keeper

A PWA (Progressive Web App) for tracking hardware purchases, warranties, and sharing with the community.

## Features

- 📱 **Mobile-First PWA** - Installable on mobile devices with offline support
- 🤖 **AI Receipt Processing** - Upload receipts and automatically extract product information
- 📄 **Smart OCR** - Advanced text extraction with confidence scoring
- 🔐 **Multi-User Support** - User authentication and personal product management
- 🏷️ **Warranty Tracking** - Automatic expiry calculation with visual alerts
- 🌍 **Community Sharing** - Share products publicly and discover what others use
- ⚡ **Real-time Updates** - Live updates with Supabase real-time subscriptions
- 📊 **Smart Dashboard** - Live statistics and warranty expiration alerts
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available)

### 1. Clone and Install

```bash
git clone <your-repo>
cd hardware_keeper
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to **Settings > API**
3. Copy your **Project URL** and **anon public key**

### 3. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Complete Supabase Setup

Follow the comprehensive setup guide: [docs/supabase-setup.md](docs/supabase-setup.md)

Or run this SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_months INTEGER,
  warranty_expires_at DATE,
  purchase_price DECIMAL(10,2),
  receipt_image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'broken', 'sold')),
  discontinue_reason TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public products" ON products
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Storage Setup (Required for AI Receipt Processing)

**IMPORTANT**: The AI receipt processing feature requires Supabase Storage setup.

1. In Supabase, go to **Storage**
2. Create a new bucket called `receipts`
3. Set the bucket to **public** (required for AI processing)
4. Configure bucket policies for security (see setup guide)

📖 **Full setup instructions**: [docs/supabase-setup.md](docs/supabase-setup.md)

### 5.1. Google Vision API Setup (Optional - for Real OCR)

To enable real OCR processing instead of mock data:

1. **Set up Google Vision API**: Follow [docs/google-vision-setup.md](docs/google-vision-setup.md)
2. **Add API key to `.env`**:
   ```env
   VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key
   ```
3. **Restart development server**
4. **Status will show**: "🟢 Google Vision API enabled"

**Without Google Vision**: App works with intelligent mock data for testing.

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:5173` to see your application!

**🔍 Check AI Status**: On the Add Product page, you'll see:
- 🟢 "Google Vision API enabled" (if configured)
- 🟡 "Using mock OCR" (if not configured)

Both modes work fully - mock data simulates realistic receipt processing.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Vercel

1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect Vite configuration
3. Add environment variables in Vercel dashboard

## Architecture

### Database Schema

- **profiles**: User profile information
- **products**: Product records with warranty tracking
- **receipts**: Receipt images and OCR data (future)

### Key Features Implementation

1. **PWA**: Configured with Vite PWA plugin for offline support
2. **Authentication**: Supabase Auth with email/password
3. **Real-time**: Supabase real-time subscriptions for live updates
4. **File Upload**: Supabase Storage for receipt images
5. **AI Integration**: Will use Supabase Edge Functions for OCR/AI processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 