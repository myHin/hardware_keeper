# Supabase Setup Guide for Hardware Keeper

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `hardware_keeper`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## 2. Database Setup

### Run Database Migration

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

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

## 3. Storage Setup for Receipt Images

### Create Storage Bucket

1. Go to **Storage** in the Supabase dashboard
2. Click **"Create bucket"**
3. Set bucket details:
   - **Name**: `receipts`
   - **Public bucket**: ✅ Check this (allows public access to receipt images)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: Leave empty (allows all image types)
4. Click **"Create bucket"**

### Set Bucket Policies

Go to **Storage > Policies** and create these policies for the `receipts` bucket:

#### Policy 1: Allow users to upload their own receipts
```sql
CREATE POLICY "Users can upload own receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Allow users to view their own receipts
```sql
CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Allow users to delete their own receipts
```sql
CREATE POLICY "Users can delete own receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. Environment Variables

### Get Your Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Update .env File

Create/update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Authentication Setup (Optional)

### Email Settings

1. Go to **Authentication > Settings**
2. Under **SMTP Settings**:
   - **Enable custom SMTP** if you want branded emails
   - Configure your email provider (Gmail, SendGrid, etc.)

### Email Templates

1. Go to **Authentication > Email Templates**
2. Customize the email templates:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

## 6. Testing Your Setup

### Test Database Connection

1. Start your development server: `npm run dev`
2. Open http://localhost:5173
3. Try creating an account
4. Check **Authentication > Users** in Supabase to see if the user was created
5. Check **Table Editor > profiles** to see if the profile was created automatically

### Test Storage

1. Add a product with a receipt image
2. Check **Storage > receipts** to see if the image was uploaded
3. Verify the file structure: `user-id/timestamp-random.extension`

### Test Product CRUD

1. Add a product with all fields
2. Edit the product
3. Mark it as public/private
4. Change its status
5. Delete it
6. Check **Table Editor > products** to verify all operations

## 7. Security Checklist

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Proper policies for user data isolation
- ✅ Storage policies prevent unauthorized access
- ✅ User registration trigger working
- ✅ Environment variables configured
- ✅ HTTPS enforced in production

## 8. Production Considerations

### Performance
- Consider enabling **Database Webhooks** for real-time features
- Set up **Connection Pooling** for high traffic
- Configure **Cache** settings appropriately

### Backup
- Enable **Point-in-time Recovery** (PITR)
- Set up regular **Database Backups**
- Export your **Schema** for version control

### Monitoring
- Set up **Database Logs** monitoring
- Configure **Usage Alerts** for limits
- Monitor **API Analytics**

## Troubleshooting

### Common Issues

1. **"relation does not exist" error**
   - Run the database migration SQL again
   - Check if you're in the correct schema

2. **Storage upload fails**
   - Verify bucket name is `receipts`
   - Check bucket policies are applied
   - Ensure bucket is set to public

3. **Authentication not working**
   - Verify environment variables are correct
   - Check if `.env` file is in project root
   - Restart development server after env changes

4. **RLS policy errors**
   - Check if policies are applied correctly
   - Verify user is authenticated when testing
   - Use SQL editor to test policies manually

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues) 