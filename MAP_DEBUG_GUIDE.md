# MAP DEBUGGING GUIDE

## ✅ FIXES APPLIED

### 1. Leaflet CSS Loading
- **Status:** ✅ Fixed
- **Location:** `src/views/MapView.js` line 22
- **Code:** `import 'leaflet/dist/leaflet.css';`
- **Verification:** Check browser DevTools > Network tab for leaflet.css loading

### 2. Map Container Height
- **Status:** ✅ Fixed
- **Location:** `src/views/MapView.js` line 586
- **Code:** `style={{ width: '100%', height: '100%', minHeight: '100vh' }}`
- **CSS:** `src/styles/MapView.css` lines 8-22

### 3. Tile Layer (OpenStreetMap)
- **Status:** ✅ Fixed
- **Location:** `src/views/MapView.js` lines 440-470
- **Tiles:** Using OpenStreetMap (free, no API key required)
- **URL:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### 4. DOM Ready Check
- **Status:** ✅ Fixed
- **Location:** `src/views/MapView.js` lines 375-428
- **Method:** React `useEffect` hook (runs after mount)
- **Safety:** Multiple guards prevent premature initialization

### 5. Error Handling
- **Status:** ✅ Added
- **Location:** `src/views/MapView.js` lines 398-426
- **Features:**
  - Try-catch around map initialization
  - Error state displayed to user
  - Console logging at every step

### 6. Z-Index Layers
- **Status:** ✅ Fixed
- **Map Container:** `z-index: 1`
- **Fog Overlay:** `z-index: 400`
- **UI Overlays:** `z-index: 500`
- **Settings Dropdown:** `z-index: 600`

---

## 🔍 CONSOLE DEBUG OUTPUT

The following console.log statements are active:

```
[MapView] Module loaded, Leaflet version: 1.9.4
[MapView] MapView component mounted
[MapView] Component render, mapContainerRef: <div>
[MapView] Loading explored zones from localStorage
[MapView] Checking location permission
[MapView] Location permission: granted
[MapView] Map init effect started
[MapView] Starting map initialization...
[MapView] Creating L.map instance...
[MapView] Map created successfully!
[MapView] Map fully initialized
[MapView] Updating tiles, layer: satellite theme: dark
[MapView] Tile URL: https://...
[MapView] Tiles added
```

---

## 📋 VERIFICATION CHECKLIST

### Step 1: Open Browser DevTools
1. Navigate to your app (usually `http://localhost:3000`)
2. Open DevTools (F12)
3. Go to Console tab

### Step 2: Navigate to Map
1. Login to the app
2. Click the "Map" button on the Menu screen
3. Watch console output

### Step 3: Check Console Output
Expected sequence:
```
✓ [MapView] Module loaded
✓ [MapView] MapView component mounted
✓ [MapView] Map created successfully!
✓ [MapView] Tiles added
```

### Step 4: Check Network Tab
1. Open Network tab in DevTools
2. Filter by "tile"
3. You should see tile images loading from:
   - `tile.openstreetmap.org` (street layer)
   - `basemaps.cartocdn.com` (dark layer)
   - `server.arcgisonline.com` (satellite layer)

### Step 5: Check Elements
1. Open Elements/Inspector tab
2. Find `.map-container` div
3. Verify it has:
   - `height: 100%`
   - `min-height: 100vh`
   - A Leaflet map inside (div.leaflet-container)

---

## ❌ COMMON ERRORS & SOLUTIONS

### Error: "mapContainerRef.current is null"
**Cause:** Component unmounted before initialization
**Solution:** Normal during navigation, ignore

### Error: "L is not defined"
**Cause:** Leaflet not imported
**Solution:** Check `import L from 'leaflet'` at top of MapView.js

### Error: "Map container not found"
**Cause:** mapContainerRef not attached
**Solution:** Verify `<div ref={mapContainerRef}>` exists

### Error: Tiles not loading (403/404)
**Cause:** API key required or rate limiting
**Solution:** Switch to OpenStreetMap (already configured)

### Error: Map not visible (black screen)
**Cause:** CSS z-index or height issue
**Solution:** 
1. Check `.map-container` has explicit height
2. Check no element is covering the map
3. Verify z-index: map=1, overlays=500+

### Error: "Geolocation permission denied"
**Cause:** User denied location access
**Solution:** 
1. Browser will show permission warning UI
2. User can enable in browser settings
3. Map still works without location

---

## 🧪 MANUAL TEST STEPS

### Test 1: Basic Map Display
1. Navigate to map view
2. Wait 2-3 seconds
3. **Expected:** Map tiles visible, can pan/zoom

### Test 2: Geolocation
1. Allow location permission when prompted
2. **Expected:** Pulse marker appears at your location

### Test 3: Theme Switching
1. Open map settings (gear icon)
2. Toggle layer: street → satellite → dark
3. Switch app theme (light/dark)
4. **Expected:** Tiles update accordingly

### Test 4: Fog of War
1. Move around (if on mobile) or drag map
2. **Expected:** Clear circle around center, fog elsewhere

### Test 5: Friend Markers
1. Ensure you have friends in the system
2. **Expected:** Friend markers with status dots

---

## 📊 FILE LOCATIONS

```
src/
├── views/
│   └── MapView.js          # Main map component (with debug logs)
├── styles/
│   └── MapView.css         # Map styles (z-index, loading spinner)
├── hooks/
│   ├── useGeolocation.js   # Geolocation logic
│   └── useFriendLocations.js # Friend location sync
└── atoms/
    └── index.js            # Map state atoms

public/
└── manifest.json           # PWA manifest

supabase-location-schema.sql # Database schema
```

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Install dependencies (if not done)
npm install leaflet react-leaflet

# 2. Run development server
npm run dev

# 3. Build for production
npm run build

# 4. Run SQL schema in Supabase
# Open Supabase SQL Editor and run contents of:
# supabase-location-schema.sql
```

---

## 📱 PWA TESTING

1. Open Chrome DevTools
2. Go to Application tab
3. Check Manifest section
4. Verify "ORB SOCIAL" appears
5. Test "Add to Home Screen"

---

## 🎯 EXPECTED BEHAVIOR

### On Map Load:
1. Loading spinner appears
2. Map tiles fade in
3. Default view: London (center: [51.505, -0.09], zoom: 13)
4. Zoom controls appear bottom-right
5. Attribution appears bottom-right

### After Geolocation Permission:
1. Pulse marker appears at user location
2. Map centers on user (if followUser enabled)
3. Explored zone clears fog around user

### With Friends:
1. Friend markers appear at their locations
2. Green dot = online (last 5 min)
3. Gray dot = offline
4. Click marker to see popup with last seen time

---

## 🔧 DEBUG MODE

To enable extra verbose logging, add to browser console:
```javascript
localStorage.setItem('orb_map_debug', 'true');
location.reload();
```

---

**Last Updated:** 2026-03-15
**Build Status:** ✅ Successful
**Dev Server:** Running on http://localhost:3000
