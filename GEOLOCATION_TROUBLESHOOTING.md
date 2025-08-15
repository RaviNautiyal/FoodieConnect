# Geolocation Troubleshooting Guide

## Common Geolocation Issues and Solutions

### 1. **Timeout Errors (Error Code 3)**

**Symptoms:**
- "Location request timed out" error message
- Browser takes too long to get location
- Spinning loader that never completes

**Causes:**
- Slow GPS signal acquisition
- Poor network connectivity
- Device in area with weak GPS signal (indoors, urban canyons)
- Browser geolocation service overloaded

**Solutions:**
- **Wait and Retry**: Click "Try Again" button for retry with different settings
- **Move to Better Location**: Go near a window or step outside briefly
- **Check Network**: Ensure stable internet connection
- **Manual Input**: Use "Enter Manually" option to input your address
- **Browser Settings**: Check if location services are enabled in browser

### 2. **Permission Denied (Error Code 1)**

**Symptoms:**
- "Location access denied" error message
- Browser never asks for location permission
- Location button appears disabled

**Causes:**
- User previously denied location permission
- Browser location services disabled
- System-level location services turned off
- Privacy settings blocking location access

**Solutions:**
- **Browser Settings**: 
  - Chrome: Settings → Privacy and Security → Site Settings → Location
  - Firefox: Settings → Privacy & Security → Permissions → Location
  - Safari: Preferences → Websites → Location
- **System Settings**:
  - Windows: Settings → Privacy → Location → App permissions
  - macOS: System Preferences → Security & Privacy → Privacy → Location Services
  - Android: Settings → Location → App permissions
  - iOS: Settings → Privacy → Location Services
- **Manual Input**: Use manual location entry as alternative

### 3. **Position Unavailable (Error Code 2)**

**Symptoms:**
- "Location information unavailable" error message
- Location services appear to work but return no data
- Intermittent location failures

**Causes:**
- GPS hardware issues
- Network-based location services unavailable
- Device in area with poor signal coverage
- Temporary service outage

**Solutions:**
- **Retry**: Click "Try Again" button
- **Check Device**: Ensure GPS is enabled on mobile devices
- **Network Check**: Verify internet connectivity
- **Manual Input**: Enter location manually
- **Wait**: Try again in a few minutes

### 4. **Slow Location Detection**

**Symptoms:**
- Location takes 10+ seconds to acquire
- Frequent timeout errors
- Inconsistent location accuracy

**Causes:**
- Device in GPS-challenged environment
- Poor network conditions
- Browser using low-accuracy fallback methods
- Device power-saving features

**Solutions:**
- **Environment**: Move to open area or near windows
- **Network**: Ensure stable WiFi or cellular connection
- **Device Settings**: Disable power-saving modes temporarily
- **Browser**: Try different browser or incognito mode
- **Manual Input**: Use address entry for immediate results

## Browser-Specific Solutions

### **Google Chrome**
1. Type `chrome://settings/content/location` in address bar
2. Ensure location access is allowed
3. Check if specific sites are blocked
4. Clear site data and try again

### **Mozilla Firefox**
1. Go to `about:preferences#privacy`
2. Scroll to Permissions section
3. Click "Settings" next to Location
4. Ensure "Ask before accessing" is selected

### **Safari (macOS/iOS)**
1. Safari → Preferences → Websites → Location
2. Ensure location access is allowed
3. Check system location services in System Preferences

### **Edge Browser**
1. Settings → Cookies and site permissions → Location
2. Ensure location access is allowed
3. Check site-specific permissions

## Mobile Device Solutions

### **Android**
1. Settings → Location → Mode → High accuracy
2. Settings → Apps → [Browser App] → Permissions → Location
3. Ensure GPS is enabled
4. Check if battery optimization is affecting location services

### **iOS**
1. Settings → Privacy → Location Services → On
2. Settings → Privacy → Location Services → [Browser App] → While Using
3. Ensure cellular data is enabled
4. Check if restrictions are enabled

## Network and Environment Factors

### **Indoor Locations**
- Move closer to windows
- Use WiFi-based location services
- Consider manual address entry

### **Urban Areas**
- GPS signals may be blocked by buildings
- Network-based location may be more reliable
- Wait for better GPS signal acquisition

### **Rural/Remote Areas**
- GPS may be more reliable than network-based location
- May take longer to acquire initial position
- Consider expanding search radius

## Alternative Solutions

### **Manual Location Entry**
When geolocation fails, users can:
1. Click "Enter Manually" button
2. Type city, state, or zip code
3. Select from location suggestions
4. Get restaurants in that area

### **Saved Locations**
- Use previously entered locations
- Switch between multiple saved addresses
- Avoid repeated geolocation attempts

### **Expand Search Area**
- Increase search radius when no results found
- Try different nearby cities
- Use broader location terms

## Performance Tips

### **For Better Geolocation Success:**
1. **Enable High Accuracy**: Allow GPS and network-based location
2. **Stable Connection**: Ensure good internet connectivity
3. **Clear View**: Move to areas with clear sky view
4. **Wait Patiently**: Allow 10-15 seconds for initial location
5. **Retry Strategy**: Use retry button with different settings

### **For Faster Results:**
1. **Manual Entry**: Type address directly for immediate results
2. **Location History**: Use previously successful locations
3. **Browser Optimization**: Close unnecessary tabs/apps
4. **Network Quality**: Use stable WiFi when possible

## When to Contact Support

Contact technical support if:
- Geolocation consistently fails across all browsers
- Location services work in other apps but not in this website
- Error messages are unclear or unhelpful
- Manual location entry also fails
- Location accuracy is consistently poor

## Prevention Strategies

### **For Users:**
- Enable location services before visiting the site
- Grant location permission when prompted
- Use stable internet connections
- Keep browsers updated to latest versions

### **For Developers:**
- Implement graceful fallbacks
- Provide clear error messages
- Offer manual alternatives
- Test across different devices and browsers
- Monitor geolocation success rates

## Conclusion

Most geolocation issues can be resolved through:
1. **Proper browser settings**
2. **System location permissions**
3. **Network connectivity**
4. **Environment factors**
5. **Manual alternatives**

The system is designed to gracefully handle failures and provide multiple ways for users to specify their location. When in doubt, manual location entry is the most reliable fallback option.


