# Calibration Issue - 2.1x Off

## Problem
Measurements are showing as 2.1x off from expected values.

## Possible Causes

### 1. Scale Input Issue
**Scenario:** User draws a 10-foot scale line, but the actual distance in the photo is different.

**Test:** 
- Take photo with tape measure visible
- Set scale to exactly what's shown (e.g., 10 feet)
- Measure a known distance (e.g., driveway width)
- Compare to actual measurement

### 2. Area Calculation Issue
Current formula:
```typescript
const scaleFeetPerPixel = scaleLengthFeet / scalePixels;
const areaSqFt = areaPixels * (scaleFeetPerPixel * scaleFeetPerPixel);
```

This is mathematically correct.

### 3. Shoelace Formula Issue
The Shoelace formula calculates area in pixels², which is then converted.

## Debug Steps

### Test Case 1: Known Rectangle
**Object:** 20 ft × 30 ft driveway (600 sq ft actual)

**Steps:**
1. Take photo with tape measure
2. Set scale to 10 feet
3. Draw rectangle around driveway
4. Note the result

**Expected:** ~600 sq ft  
**If 2.1x larger:** Shows ~1260 sq ft  
**If 2.1x smaller:** Shows ~286 sq ft

### Test Case 2: Direct Measurement
**Object:** Tape measure in photo showing 10 feet

**Steps:**
1. Take photo of tape measure
2. Set scale to 10 feet (using the visible tape)
3. Draw rectangle around the 10-ft section
4. Should show 100 sq ft (10×10)

## Quick Fix Options

### Option A: Add Calibration Factor
```typescript
const CALIBRATION_FACTOR = 1.0; // Adjust this
const areaSqFt = areaPixels * (scaleFeetPerPixel * scaleFeetPerPixel) * CALIBRATION_FACTOR;
```

### Option B: Debug Display
Show intermediate values:
- Scale pixels: ___
- Scale feet: ___  
- Feet per pixel: ___
- Area pixels: ___
- Final sq ft: ___

## Next Steps

1. **Test with known dimensions** to confirm the 2.1x factor
2. **Determine direction:** Is result too large or too small?
3. **Apply calibration factor** or fix root cause
4. **Test again** with multiple known measurements

## Questions for User

1. **What measurement did you test?** (e.g., "20 ft driveway")
2. **What did the app show?** (e.g., "42 sq ft" or "1260 sq ft")
3. **How did you set the scale?** (e.g., " Drew line along 10-ft tape measure")
4. **Is the result too big or too small?**

---

**Once we know the exact test case, we can apply the right fix!**
