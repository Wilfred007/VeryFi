# VeryFi Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- Vercel account
- GitHub repository (optional but recommended)

### Method 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel --prod
   ```

### Method 2: Deploy via GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: VeryFi rebrand and deployment ready"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` folder as root directory
   - Deploy!

### Method 3: Deploy via Vercel Dashboard

1. **Zip the frontend folder**
2. **Upload to Vercel dashboard**
3. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

## 🔧 Environment Variables

Set these in Vercel dashboard:

```env
REACT_APP_HEALTH_AUTHORITY_REGISTRY=0xF0AcD34E64736F6AB60E39088469ae86fF165AA9
REACT_APP_ZK_HEALTH_PASS_REGISTRY=0x749AFac3004131CF8DB9e820Bc6D9f3F654Ab44F
REACT_APP_MIDNIGHT_MCP_URL=https://your-mcp-server.vercel.app
REACT_APP_CHAIN_ID=4202
REACT_APP_NETWORK_NAME=Lisk Sepolia
REACT_APP_RPC_URL=https://rpc.sepolia-api.lisk.com
REACT_APP_EXPLORER_URL=https://sepolia-blockscout.lisk.com
REACT_APP_APP_NAME=VeryFi
REACT_APP_APP_DESCRIPTION=AI-Powered Health Verification using zero-knowledge proofs on Midnight blockchain
```

## 🌙 Deploy Midnight MCP Server

The MCP server also needs to be deployed for full functionality:

### Option 1: Deploy to Vercel (Serverless)
```bash
cd midnight-mcp
vercel --prod
```

### Option 2: Deploy to Railway/Render
- Better for persistent connections
- Upload the `midnight-mcp` folder
- Set build command: `npm run build`
- Set start command: `npm start`

## 🎯 Post-Deployment

1. **Update MCP URL**: Update `REACT_APP_MIDNIGHT_MCP_URL` with your deployed MCP server URL
2. **Test functionality**: Verify all features work in production
3. **Custom domain**: Add your custom domain in Vercel settings

## 🔍 Troubleshooting

### Build Errors
- Check wagmi configuration compatibility
- Verify all dependencies are installed
- Check TypeScript errors

### Runtime Errors
- Verify environment variables are set
- Check network connectivity
- Verify contract addresses are correct

## 📊 Performance Optimization

- Static assets are cached for 1 year
- SPA routing configured for client-side navigation
- Build optimizations enabled

Your VeryFi application is now ready for production! 🎉
