# Testing AI Receipt Processing Features

## Overview

The Hardware Keeper app now includes powerful AI-powered receipt processing with **Google Vision API integration** that can automatically extract real text from receipt images. This guide will help you test all the AI features in both mock and real modes.

## Prerequisites

Before testing AI features, ensure:

1. ✅ **Supabase Storage is configured** (see [supabase-setup.md](supabase-setup.md))
2. ✅ **`receipts` bucket exists** and is set to public
3. ✅ **Storage policies are applied** for user data isolation
4. ✅ **Development server is running** (`npm run dev`)
5. 🔧 **Google Vision API configured** (optional - see [google-vision-setup.md](google-vision-setup.md))

## Test Modes

### Mock Mode (Default)
- **When**: No `VITE_GOOGLE_VISION_API_KEY` configured
- **Status**: 🟡 "Using mock OCR - Add VITE_GOOGLE_VISION_API_KEY for real processing"
- **Behavior**: Uses intelligent mock data that simulates Best Buy receipt
- **Benefits**: Works offline, no API costs, consistent results for testing

### Google Vision Mode
- **When**: `VITE_GOOGLE_VISION_API_KEY` configured correctly
- **Status**: 🟢 "Google Vision API enabled - Real OCR processing"
- **Behavior**: Uses real Google Vision API for text extraction
- **Benefits**: Real OCR results, works with any receipt image

## Test Scenarios

### 1. Basic Receipt Upload and Processing

**Scenario**: Upload a receipt image and verify AI processing works

**Mock Mode Steps**:
1. Go to **Add Product** page
2. Should see: "🟡 Using mock OCR - Add VITE_GOOGLE_VISION_API_KEY for real processing"
3. **Upload any image** (content doesn't matter in mock mode)
4. Click **"Process with Mock AI (Cloud)"**
5. **Watch the progress**:
   - 📤 "Uploading receipt image..." (20%)
   - 🔍 "Extracting text from receipt..." (50%)
   - 🤖 "Analyzing products with AI..." (80%)
   - ✅ "Found 3 products!" (100%)

**Google Vision Mode Steps**:
1. Go to **Add Product** page
2. Should see: "🟢 Google Vision API enabled - Real OCR processing"
3. **Upload a real receipt image** (content matters now!)
4. Click **"Process with Google Vision (Cloud)"**
5. **Watch the progress**:
   - 📤 "Uploading receipt image..." (20%)
   - 🤖 "Extracting text with Google Vision AI..." (50%)
   - 🧠 "Analyzing products with AI..." (80%)
   - ✅ "Found X products!" (100%)

**Expected Results**:
- **Mock Mode**: Always finds 3 predefined products (MacBook Pro, Magic Mouse, USB Cable)
- **Google Vision Mode**: Finds actual products from the receipt text
- Products display with confidence scores
- All products are auto-selected initially
- Receipt image is stored in Supabase Storage

### 2. Comparing Mock vs Real Processing

**Scenario**: Test the same image in both modes

**Setup**:
1. Start with mock mode (no Google Vision API key)
2. Test with any image
3. Note the results
4. Add Google Vision API key to `.env`
5. Restart dev server
6. Test with same image

**Expected Differences**:
- **Mock Mode**: Always consistent results regardless of image content
- **Google Vision Mode**: Results vary based on actual text in image
- **Processing Messages**: Different status messages indicating the mode
- **Confidence Scores**: Real confidence from Google Vision vs. simulated scores

### 3. Real Receipt Testing (Google Vision Mode Only)

**Scenario**: Test with various real receipt types

**Test Images**:
1. **Clear grocery receipt** (high contrast, good quality)
2. **Electronics store receipt** (Best Buy, Amazon, etc.)
3. **Restaurant receipt** (thermal printer)
4. **Handwritten receipt** (challenging for OCR)
5. **Faded/poor quality receipt** (test edge cases)
6. **Non-English receipt** (test language handling)

**Expected Results**:
- **Clear receipts**: High confidence scores (>80%)
- **Poor quality**: Lower confidence, possible extraction failures
- **Different formats**: Varying product detection success
- **Fallback behavior**: Should gracefully handle failures

### 4. Product Selection and Auto-Fill

**Scenario**: Select extracted products and auto-fill the form

**Steps**:
1. After successful processing, **review extracted products**
2. **Uncheck products you don't want** (test selection/deselection)
3. Click **"Add X Selected Products"**
4. **Verify form auto-fill**:
   - Product name filled
   - Brand and model populated (if detected)
   - Purchase price set
   - Warranty months added
   - Purchase date applied (if found)

**Expected Results**:
- **Mock Mode**: Consistent auto-fill with Apple products
- **Google Vision Mode**: Auto-fill varies based on actual receipt content
- Form fields are automatically populated with AI-extracted data
- AI extraction banner appears above the form
- User can still edit all fields manually

### 5. Local vs Cloud Processing

**Scenario**: Compare different processing methods

**Test Local Processing**:
1. Upload a receipt image
2. Click **"Process with Google Vision (Local)"** or **"Process with Mock AI (Local)"**
3. Should show local processing message
4. Results should be the same as cloud processing

**Test Cloud Processing**:
1. Upload a receipt image
2. Click **"Process with Google Vision (Cloud)"** or **"Process with Mock AI (Cloud)"**
3. Should show upload progress then processing progress
4. Image should be saved to Supabase Storage

**Expected Differences**:
- **Cloud Processing**: Image uploaded to Supabase Storage
- **Local Processing**: Image processed without upload
- **Same Results**: OCR and product extraction should be identical

### 6. Error Handling

**Scenario**: Test error scenarios and edge cases

**Test Large File**:
1. Upload an image larger than 10MB
2. Should show error message about file size

**Test Invalid File**:
1. Try uploading a non-image file (PDF, text file)
2. Should be rejected by file picker

**Test Google Vision API Errors** (Vision Mode Only):
1. **Invalid API Key**: Set wrong API key, should fallback to mock
2. **Quota Exceeded**: Simulate quota exceeded error
3. **Network Error**: Disconnect internet during processing
4. **Malformed Image**: Upload corrupted image file

**Test Image Quality Issues** (Vision Mode Only):
1. **Blank Image**: Upload white/black image
2. **No Text Image**: Upload image without text
3. **Blurry Image**: Upload severely blurred receipt
4. **Wrong Orientation**: Upload rotated receipt

### 7. Multi-Product Receipts

**Scenario**: Handle receipts with multiple products

**Mock Mode**:
- Always returns 3 products regardless of image
- Tests selection and form auto-fill logic

**Google Vision Mode**:
- Results depend on actual receipt content
- Test with receipts containing 1, 3, 5+ items
- Verify each product is detected separately

**Steps**:
1. Upload receipt with multiple items
2. AI should detect multiple products
3. **Test selective addition**:
   - Uncheck some products
   - Add only selected ones
   - Verify only selected products are added

### 8. Storage and Security Verification

**Scenario**: Verify receipt images are properly stored and secured

**Steps**:
1. Process a receipt with cloud processing
2. **Check Supabase Storage**:
   - Go to Storage > receipts in Supabase dashboard
   - Should see uploaded image in user's folder
   - Filename format: `user-id/timestamp-random.extension`
3. **Test cross-user access**:
   - Create second user account
   - Try to access first user's receipt URLs
   - Should be blocked by RLS policies

## Mock Data Reference

The mock implementation simulates this Best Buy receipt:

```
Best Buy Store #1234
Receipt #: REC-2024-001234
Date: [Current Date]

ITEMS PURCHASED:
1. Apple MacBook Pro 16-inch M3 Pro - $2,499.99
   - Model: MacBook Pro 16" M3 Pro
   - Warranty: 1 Year Limited Warranty
   - Confidence: 92%

2. Apple Magic Mouse - $79.99
   - Model: Magic Mouse (3rd Gen)
   - Confidence: 88%

3. USB-C Charging Cable - $29.99
   - Model: USB-C to USB-C Cable 2m
   - Brand: Apple
   - Confidence: 85%

Total: $2,831.82 (including tax)
```

## Google Vision Testing Tips

### Best Practices for Receipt Images

1. **Good Lighting**: Avoid shadows and glare
2. **High Contrast**: Dark text on light background
3. **Straight Orientation**: Align text horizontally
4. **Full Receipt**: Include top and bottom
5. **Clear Focus**: Avoid blur and motion
6. **Appropriate Size**: 1-10MB file size

### Common OCR Challenges

1. **Thermal Printer Receipts**: Often faded
2. **Handwritten Text**: Lower accuracy
3. **Multiple Languages**: May need language hints
4. **Small Text**: Size matters for accuracy
5. **Curved Receipts**: Flatten for best results

### Debugging Google Vision

Enable debug mode in `.env`:
```env
VITE_DEBUG_VISION=true
```

Check browser console for:
- Raw OCR text extraction
- Confidence scores
- API response details
- Processing timing

## Performance Testing

### OCR Processing Speed

**Mock Mode**:
- ~2 seconds simulated OCR
- ~1.5 seconds simulated AI parsing
- Consistent timing

**Google Vision Mode**:
- Variable based on image size and complexity
- Network latency affects cloud processing
- Monitor processing times in console

### File Upload Performance

**Test Scenarios**:
- Small images (< 1MB): Should be fast
- Large images (5-10MB): Should show progress
- Poor network: Should handle timeouts gracefully

## Production Readiness Testing

Before deploying with Google Vision:

- [ ] **API Key Security**: Properly restricted and secured
- [ ] **Error Handling**: All error scenarios covered
- [ ] **Rate Limiting**: Prevent API abuse
- [ ] **Cost Monitoring**: Track API usage
- [ ] **Fallback Strategy**: Handle API failures gracefully
- [ ] **Image Validation**: Validate uploads
- [ ] **Performance**: Acceptable processing times
- [ ] **Cross-browser**: Test in different browsers

## Troubleshooting

### Google Vision Not Working

1. **Check API Key**: Verify it's correct and unrestricted
2. **Check Console**: Look for error messages
3. **Test Connection**: Check network connectivity
4. **Verify Billing**: Ensure Google Cloud billing is active
5. **Check Quotas**: Verify API limits haven't been exceeded

### Mock Mode Issues

1. **No Products Found**: Check fallback patterns
2. **Wrong Form Data**: Verify auto-fill logic
3. **Processing Hangs**: Check promise handling

### Common Errors

- **"API key not valid"**: Check Google Cloud Console
- **"Quota exceeded"**: Monitor usage or upgrade plan
- **"Permission denied"**: Verify API is enabled
- **"Network error"**: Check internet connection

### Getting Help

- **Google Vision Issues**: [Google Vision API Docs](https://cloud.google.com/vision/docs)
- **Hardware Keeper Issues**: Check GitHub Issues
- **General Support**: Join our Discord community 