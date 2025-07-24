-- Database Migration: Add Product Photo Support
-- Run this in your Supabase SQL Editor to add product photo functionality

-- Add product_image_url column to products table
ALTER TABLE products 
ADD COLUMN product_image_url TEXT;

-- Create storage bucket for product photos (if not exists)
-- Note: You may need to run this through the Supabase dashboard if it doesn't work in SQL editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product photos
CREATE POLICY "Users can upload own product photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own product photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own product photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to product photos (optional - for sharing features)
CREATE POLICY "Public can view product photos" ON storage.objects
FOR SELECT USING (bucket_id = 'product-photos'); 