# DrivewayCalc Hybrid - Status & Plan

## ✅ What We Have
- **Base:** Our working driveway-calc (mobile camera works)
- **V2 Features to Add:**
  - Zoom controls
  - Keyboard shortcuts (Ctrl+Z, Enter, Esc)
  - Better save dialog (modal, not prompt)
  - Undo last point (not clear all)
  - Live preview lines
  - Toast notifications
  - More material estimates

## 🎯 Hybrid Approach

Since V2 files are minified, I'll implement features manually:

### Step 1: Add Zoom Controls
```typescript
// Add to MeasurementCanvas
const [zoom, setZoom] = useState(1);

// Add zoom buttons to UI
<Button onClick={() => setZoom(z => z * 1.1)}>Zoom In</Button>
<Button onClick={() => setZoom(z => z / 1.1)}>Zoom Out</Button>
<Button onClick={() => setZoom(1)}>Fit</Button>
```

### Step 2: Add Keyboard Shortcuts
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z') {
      // Undo last point
      handleUndo();
    } else if (e.key === 'Enter') {
      // Close polygon
      handleClosePolygon();
    } else if (e.key === 'Escape') {
      // Cancel tool
      setActiveTool(null);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Step 3: Better Save Dialog
Replace `prompt()` with a custom modal component.

### Step 4: Undo Functionality
Add to store:
```typescript
undoLastPoint: () => set((state) => ({
  perimeterPoints: state.perimeterPoints.slice(0, -1)
}));
```

## 📋 Implementation Order

1. **Zoom controls** (highest priority)
2. **Keyboard shortcuts**
3. **Undo last point**
4. **Better save dialog**
5. **Toast notifications**
6. **Live preview lines**
7. **More materials**

## 🚀 Next Steps

I'll implement these one by one, starting with zoom controls. Each feature will be:
- Tested individually
- Committed separately
- Easy to rollback if issues

**Ready to start implementing!**

Which feature should I implement first?
