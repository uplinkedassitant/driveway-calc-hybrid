# Accuracy Test Plan

## Current Status
- V2 has better UI features (zoom, keyboard shortcuts, etc.)
- Our version works on mobile
- Need to verify which has more accurate calculations

## Test Method

### Test Case: Known Area
**Object:** Standard driveway or room
**Known dimensions:** 20 ft × 30 ft = 600 sq ft

### Steps:
1. Take photo with tape measure visible
2. Upload to BOTH versions
3. Set scale using same reference (e.g., 10 ft tape)
4. Draw perimeter around same area
5. Compare results

### Expected Results:
- Our version: ___ sq ft
- V2 version: ___ sq ft  
- Actual: 600 sq ft
- Winner: (closest to 600)

## Calculation Formula Comparison

### Our Current Formula:
```typescript
const scaleFeetPerPixel = scaleLengthFeet / scalePixels;
const areaSqFt = areaPixels * (scaleFeetPerPixel * scaleFeetPerPixel);
```

### Their Formula (V2):
Should be identical, but let me verify from their code...

## Next Steps

1. Test both versions with same photo
2. Compare accuracy
3. If V2 is more accurate, port their calculation
4. If same accuracy, keep our version and add their UI features manually

## Decision Matrix

| Scenario | Action |
|----------|--------|
| V2 more accurate | Port their calculation to our version |
| Same accuracy | Keep our version, add UI features |
| Our version better | Keep our version, ignore V2 |

---

**Ready to test!** Need to run the actual test with known dimensions.
