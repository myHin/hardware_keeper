# Google Vision API Setup Guide

## Overview

This guide will help you set up Google Vision API for real OCR (Optical Character Recognition) processing in Hardware Keeper. With Google Vision API, you can extract actual text from receipt images instead of using mock data.

## Prerequisites

- Google Cloud Platform (GCP) account
- Active billing account (Google Vision has a free tier)
- Hardware Keeper project already set up

## Step 1: Create Google Cloud Project

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** or select existing one:
   - Click "Select a project" → "New Project"
   - Project name: `hardware-keeper-vision`
   - Click "Create"

## Step 2: Enable Vision API

1. **Navigate to APIs & Services**:
   - In the sidebar, click "APIs & Services" → "Library"
2. **Search for Vision API**:
   - Search: "Cloud Vision API"
   - Click on "Cloud Vision API"
3. **Enable the API**:
   - Click "Enable" button
   - Wait for activation (may take a few minutes)

## Step 3: Create API Key

### Option A: API Key (Recommended for Development)

1. **Go to Credentials**:
   - APIs & Services → Credentials
2. **Create API Key**:
   - Click "Create Credentials" → "API key"
   - Copy the generated API key
   - **Important**: Restrict the API key for security

3. **Restrict API Key** (Recommended):
   - Click on the API key to edit
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose "Cloud Vision API"
   - Under "Application restrictions":
     - Select "HTTP referrers" for web apps
     - Add your domains (e.g., `localhost:5173`, `your-domain.com`)
   - Click "Save"

### Option B: Service Account (Production)

1. **Create Service Account**:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: `hardware-keeper-vision`
   - Click "Create and Continue"

2. **Assign Roles**:
   - Add role: "Cloud Vision API User"
   - Click "Continue" → "Done"

3. **Generate Key**:
   - Click on created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Download the key file

## Step 4: Configure Environment Variables

### For API Key Method

Add to your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
```

### For Service Account Method

For service accounts, you'll need to implement server-side authentication. The current implementation uses API keys for simplicity.

## Step 5: Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Check Google Vision status**:
   - Go to Add Product page
   - You should see: "🟢 Google Vision API enabled - Real OCR processing"

3. **Test with a receipt**:
   - Upload any receipt image
   - Click "Process with Google Vision (Cloud)"
   - Watch for real OCR extraction

## API Pricing

### Free Tier (Monthly)
- **First 1,000 units**: Free
- **TEXT_DETECTION**: 1,000 images/month free

### Paid Tier
- **TEXT_DETECTION**: $1.50 per 1,000 images
- **DOCUMENT_TEXT_DETECTION**: $1.50 per 1,000 images

**Estimation**: For typical usage (50-100 receipts/month), costs are minimal.

## Security Best Practices

### 1. API Key Restrictions
```
✅ Restrict to specific APIs (Cloud Vision API only)
✅ Restrict to specific referrers (your domains)
✅ Monitor usage in Cloud Console
✅ Rotate keys regularly
```

### 2. Environment Variables
```
✅ Never commit API keys to version control
✅ Use .env files for local development
✅ Use platform environment variables for production
✅ Consider server-side proxy for production
```

### 3. Usage Monitoring
```
✅ Set up billing alerts
✅ Monitor API quotas
✅ Implement rate limiting
✅ Log processing attempts
```

## Troubleshooting

### Common Issues

#### 1. "API key not valid" Error
**Cause**: Invalid or restricted API key
**Solution**:
- Verify API key is correct
- Check API restrictions include Cloud Vision API
- Ensure referrer restrictions match your domain

#### 2. "Permission denied" Error
**Cause**: API not enabled or insufficient permissions
**Solution**:
- Enable Cloud Vision API in Google Cloud Console
- Check billing account is active
- Verify API key has correct permissions

#### 3. "Quota exceeded" Error
**Cause**: Exceeded free tier or quotas
**Solution**:
- Check usage in Google Cloud Console
- Increase quotas or upgrade billing
- Implement rate limiting

#### 4. CORS Issues
**Cause**: Cross-origin request blocked
**Solution**:
- Add your domain to API key restrictions
- Use HTTPS in production
- Consider server-side proxy

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
VITE_DEBUG_VISION=true
```

This will show detailed OCR responses in browser console.

### Testing Connection

The app includes a connection test. Check browser console for:
```
✅ Google Vision API connection: SUCCESS
❌ Google Vision API connection: FAILED
```

## Production Deployment

### Environment Variables Setup

#### Netlify
1. Go to Site settings → Environment variables
2. Add: `VITE_GOOGLE_VISION_API_KEY`
3. Redeploy site

#### Vercel
1. Go to Project settings → Environment Variables
2. Add: `VITE_GOOGLE_VISION_API_KEY`
3. Redeploy

#### Self-hosted
```bash
export VITE_GOOGLE_VISION_API_KEY="your_api_key"
npm run build
```

### Security Considerations

For production, consider:

1. **Server-side Proxy**: Handle Vision API calls server-side
2. **Rate Limiting**: Prevent abuse
3. **Image Validation**: Validate uploaded images
4. **Error Handling**: Graceful fallbacks
5. **Monitoring**: Track usage and errors

## Alternative OCR Services

If Google Vision doesn't meet your needs:

### Tesseract.js (Client-side)
```bash
npm install tesseract.js
```
- ✅ Free and offline
- ❌ Lower accuracy
- ❌ Larger bundle size

### AWS Textract
```bash
npm install @aws-sdk/client-textract
```
- ✅ Good accuracy
- ✅ Table detection
- ❌ More complex setup

### Azure Computer Vision
```bash
npm install @azure/cognitiveservices-computervision
```
- ✅ Good accuracy
- ✅ Multiple languages
- ❌ Microsoft ecosystem

## Support

### Getting Help

- [Google Vision API Documentation](https://cloud.google.com/vision/docs)
- [Google Cloud Support](https://cloud.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-vision)

### Hardware Keeper Issues

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Review console logs
- Test with simple images first

## Next Steps

Once Google Vision is working:

1. **Implement real AI parsing** with OpenAI GPT
2. **Add image preprocessing** for better OCR accuracy
3. **Implement batch processing** for multiple receipts
4. **Add confidence thresholds** for quality control
5. **Create receipt templates** for different stores 