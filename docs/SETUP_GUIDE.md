# 🔧 Initial Setup Instructions

## Step-by-Step Guide to Deploy Minebench UI on Akash

### 1. 📁 Prepare Your Repository

1. **Fork or clone this repository**
   ```bash
   git clone <your-repo-url>
   cd minebench-ui
   ```

2. **Update deploy.yml with your GitHub username**
   ```yaml
   # In deploy.yml, replace YOUR_USERNAME with your actual GitHub username
   image: ghcr.io/YOUR_USERNAME/minebench-ui:latest
   ```

### 2. 🐳 GitHub Container Registry Setup

#### Option A: Automated (Recommended)
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - Build Docker image
   - Push to GitHub Container Registry
   - Generate deployment artifacts

#### Option B: Manual Setup
1. **Create GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `write:packages`, `read:packages`
   - Copy the token

2. **Run build script**
   ```bash
   # Linux/macOS
   ./build-and-push.sh
   
   # Windows PowerShell
   .\build-and-push.ps1
   ```

### 3. 🔓 Make Package Public

1. Go to your GitHub repository
2. Click on "Packages" tab
3. Find your `minebench-ui` package
4. Click on the package name
5. Click "Package settings"
6. Scroll down to "Danger Zone"
7. Click "Change visibility"
8. Select "Public"
9. Confirm the change

### 4. 🌐 Akash Network Setup

#### Install Akash CLI
```bash
# Linux/macOS
curl -sSfL https://raw.githubusercontent.com/akash-network/node/master/install.sh | sh

# Windows
# Download from: https://github.com/akash-network/node/releases
```

#### Create Akash Account
```bash
# Generate a new key
akash keys add mykey

# Get your address
akash keys show mykey -a

# Fund your account with AKT tokens
# Buy AKT on exchanges like Osmosis, Gate.io, etc.
```

#### Check Balance
```bash
akash query bank balances $(akash keys show mykey -a)
```

### 5. 🚀 Deploy to Akash

#### Automated Deployment
```bash
# Linux/macOS
./deploy-to-akash.sh

# Windows PowerShell
.\deploy-to-akash.ps1
```

#### Manual Deployment
```bash
# 1. Create deployment
akash tx deployment create deploy.yml --from mykey --fees 5000uakt

# 2. Get DSEQ from output, then create lease
akash tx market lease create --owner $(akash keys show mykey -a) --dseq <DSEQ> --gseq 1 --oseq 1 --provider <PROVIDER_ADDRESS> --from mykey --fees 5000uakt

# 3. Send manifest
akash provider send-manifest deploy.yml --owner $(akash keys show mykey -a) --dseq <DSEQ> --provider <PROVIDER_ADDRESS>

# 4. Get service URL
akash provider lease-status --owner $(akash keys show mykey -a) --dseq <DSEQ> --provider <PROVIDER_ADDRESS>
```

### 6. 📊 Monitor Your Deployment

```bash
# Check deployment status
akash query deployment get --owner $(akash keys show mykey -a) --dseq <DSEQ>

# View logs
akash provider lease-logs --owner $(akash keys show mykey -a) --dseq <DSEQ> --provider <PROVIDER_ADDRESS>

# Check lease status
akash provider lease-status --owner $(akash keys show mykey -a) --dseq <DSEQ> --provider <PROVIDER_ADDRESS>
```

## 💰 Cost Estimation

- **CPU**: 0.5 units
- **Memory**: 512Mi  
- **Storage**: 1Gi
- **Price**: 1000 uakt per block (~6 seconds)
- **Monthly cost**: ~4,320,000 uakt (~$43-432 depending on AKT price)

## 🛠️ Troubleshooting

### Common Issues

1. **"Image not found" error**
   - Ensure image is public in GitHub Packages
   - Check image name matches your username

2. **"No providers available"**
   - Wait longer for providers to bid
   - Try reducing resource requirements

3. **"Insufficient balance"**
   - Fund your account with more AKT tokens
   - Check current balance

4. **"Deployment failed"**
   - Verify deploy.yml syntax
   - Check resource requirements

### Useful Commands

```bash
# List all deployments
akash query deployment list --owner $(akash keys show mykey -a)

# Close deployment
akash tx deployment close --owner $(akash keys show mykey -a) --dseq <DSEQ> --from mykey --fees 5000uakt

# Update deployment
akash tx deployment update deploy.yml --from mykey --fees 5000uakt --dseq <DSEQ>
```

## 📚 Additional Resources

- [Akash Documentation](https://docs.akash.network/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Akash Provider List](https://github.com/akash-network/provider)

---

**🎉 Your Minebench UI is now ready for decentralized deployment!**
