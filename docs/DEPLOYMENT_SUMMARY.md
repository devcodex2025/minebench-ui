# 🎯 Minebench UI - Complete Deployment Guide

## 📋 What You Have Now

✅ **Complete Next.js Application**
- Modern React components with TypeScript
- Interactive benchmark tables with sorting/filtering
- Responsive design with Tailwind CSS
- Mock data for demonstration

✅ **Docker Configuration**
- Optimized Dockerfile for production
- Multi-platform support (AMD64/ARM64)
- Standalone Next.js output

✅ **GitHub Integration**
- Automated CI/CD with GitHub Actions
- GitHub Container Registry support
- Automatic Docker image building

✅ **Akash Network Ready**
- Complete deployment configuration
- Automated deployment scripts
- Cost-optimized resource allocation

## 🚀 Quick Start (3 Steps)

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Make Package Public
- Go to GitHub repository → Packages
- Find `minebench-ui` package
- Make it public in settings

### 3. Deploy to Akash
```bash
# Linux/macOS
./deploy-to-akash.sh

# Windows PowerShell  
.\deploy-to-akash.ps1
```

## 📁 File Structure

```
minebench-ui/
├── app/                    # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/             # React components
│   ├── BenchmarkTable.tsx  # Results table
│   └── StatsCards.tsx      # Statistics cards
├── lib/                    # Utilities
│   └── utils.ts           # Helper functions
├── types/                  # TypeScript types
│   └── benchmark.ts       # Data interfaces
├── .github/workflows/      # GitHub Actions
│   └── docker.yml         # CI/CD pipeline
├── deploy.yml             # Akash deployment config
├── Dockerfile             # Container definition
├── docker-compose.yml     # Local Docker setup
├── build-and-push.sh      # Manual build script
├── deploy-to-akash.sh     # Automated deployment
└── README.md              # Documentation
```

## 🔧 Configuration Files

### Key Files to Update:

1. **deploy.yml** - Replace `YOUR_USERNAME` with your GitHub username
2. **build-and-push.sh** - Update `GITHUB_USERNAME` variable
3. **build-and-push.ps1** - Update `$GITHUB_USERNAME` variable

### Environment Variables:
- `NODE_ENV=production`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`

## 💰 Cost Breakdown

**Akash Deployment Costs:**
- CPU: 0.5 units
- Memory: 512Mi
- Storage: 1Gi
- Price: 1000 uakt per block (~6 seconds)
- Monthly: ~4,320,000 uakt

**Estimated Monthly Cost:**
- At $0.01/AKT: ~$43/month
- At $0.10/AKT: ~$432/month

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Docker
```bash
docker build -t minebench-ui .           # Build image
docker run -p 3000:3000 minebench-ui     # Run container
docker-compose up -d                     # Run with compose
```

### Deployment
```bash
./build-and-push.sh          # Build and push to GitHub
./deploy-to-akash.sh         # Deploy to Akash
```

## 📊 Features

### Dashboard Features:
- ✅ Real-time benchmark data display
- ✅ Interactive tables with sorting/filtering
- ✅ Search functionality
- ✅ CSV export capability
- ✅ Performance statistics
- ✅ Responsive design
- ✅ Modern UI with mining theme

### Technical Features:
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Next.js 14 with App Router
- ✅ Docker containerization
- ✅ GitHub Actions CI/CD
- ✅ Akash Network deployment
- ✅ Multi-platform support

## 🔗 Important Links

- **GitHub Repository**: Your forked repository
- **GitHub Packages**: `https://github.com/YOUR_USERNAME/minebench-ui/pkgs/container/minebench-ui`
- **Akash Documentation**: https://docs.akash.network/
- **Next.js Documentation**: https://nextjs.org/docs

## 🆘 Support

### Common Issues:
1. **Image not found**: Make sure package is public
2. **No providers**: Wait longer or reduce resources
3. **Insufficient balance**: Fund account with AKT
4. **Build fails**: Check GitHub Actions logs

### Getting Help:
- Check GitHub Actions logs
- Review Akash deployment status
- Consult Akash documentation
- Check provider availability

---

## 🎉 You're Ready!

Your Minebench UI is now fully configured for:
- ✅ Local development
- ✅ Docker deployment  
- ✅ GitHub Container Registry
- ✅ Akash Network deployment

**Next Steps:**
1. Push to GitHub
2. Make package public
3. Deploy to Akash
4. Monitor your deployment

**Happy Mining! ⛏️**
