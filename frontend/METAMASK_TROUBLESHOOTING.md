# 🦊 MetaMask Connection Troubleshooting

## ✅ What I Fixed

1. **Simplified wagmi Configuration**: Removed complex RainbowKit setup and used direct wagmi connectors
2. **Added MetaMask Detection**: Explicit MetaMask and injected wallet connectors
3. **Debug Component**: Added wallet debug info in bottom-left corner
4. **Better Error Handling**: Console logging for connection attempts

## 🔍 Debugging Steps

### 1. Check the Debug Panel
Look at the bottom-left corner of the app for:
- Available connectors (should show "MetaMask" and "Injected")
- MetaMask detection status

### 2. Browser Console
Open browser DevTools (F12) and check for:
- Connection attempts logged to console
- Any error messages
- MetaMask provider detection

### 3. MetaMask Issues
If MetaMask isn't popping up:

**Option A: Manual Connection**
1. Open MetaMask extension
2. Go to "Connected sites" 
3. Manually connect to `localhost:3004`

**Option B: Reset MetaMask**
1. MetaMask → Settings → Advanced → Reset Account
2. Refresh the page and try connecting again

**Option C: Check Network**
1. Ensure MetaMask is on Sepolia testnet
2. If not, the app should prompt to switch networks

### 4. Browser Issues
- **Disable ad blockers** that might block MetaMask
- **Try incognito mode** to rule out extension conflicts
- **Clear browser cache** and reload

## 🛠️ Technical Details

### Current Configuration
```typescript
// wagmi config with direct connectors
connectors: [
  injected(),    // Detects MetaMask and other wallets
  metaMask(),    // Explicit MetaMask connector
]
```

### Connection Flow
1. Click "Connect Wallet" button
2. App finds MetaMask connector
3. Calls `connect({ connector })` 
4. MetaMask should popup for approval

### Debug Information
The app now shows:
- Available wallet connectors
- MetaMask detection status
- Connection state in console

## 🚨 Common Issues

### Issue: "No connectors found"
**Solution**: MetaMask not installed or disabled
- Install MetaMask browser extension
- Enable the extension
- Refresh the page

### Issue: MetaMask detected but no popup
**Solution**: MetaMask might be locked or busy
- Unlock MetaMask manually
- Close any pending MetaMask popups
- Try connecting again

### Issue: Wrong network
**Solution**: Switch to Sepolia testnet
- MetaMask → Networks → Sepolia test network
- Or let the app prompt you to switch

## 🎯 Expected Behavior

When working correctly:
1. Click "Connect Wallet"
2. MetaMask popup appears
3. User approves connection
4. App shows connected address
5. Network indicator shows "Sepolia"
6. Balance displays (if you have test ETH)

## 📞 Still Having Issues?

If MetaMask still won't connect:
1. Check the debug panel for connector info
2. Look at browser console for errors
3. Try the manual connection steps above
4. Consider using a different browser/device to isolate the issue
