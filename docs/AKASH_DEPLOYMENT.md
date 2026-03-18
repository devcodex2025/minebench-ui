# 🚀 Akash Deployment Guide for Minebench UI

This guide will help you deploy your Minebench UI container to the Akash Network.

## 📋 Prerequisites

### 1. Install Akash CLI
```bash
# Download and install Akash CLI
curl -sSfL https://raw.githubusercontent.com/akash-network/node/master/install.sh | sh

# Or using package managers
# Ubuntu/Debian:
sudo apt-get install akash

# macOS:
brew install akash

# Windows:
# Download from GitHub releases
```

### 2. Create Akash Account
```bash
# Generate a new key
akash keys add mykey

# Fund your account with AKT tokens
# You can buy AKT on exchanges like Osmosis, Gate.io, etc.
```

### 3. GitHub Container Registry Setup

#### Option A: Use GitHub Actions (Recommended)
1. Push your code to GitHub
2. The GitHub Actions workflow will automatically build and push your image
3. Make your package public in GitHub Packages

#### Option B: Manual Build and Push
1. Create a GitHub Personal Access Token with `write:packages` scope
2. Run the build script:
   ```bash
   # Linux/macOS
   ./build-and-push.sh
   
   # Windows PowerShell
   .\build-and-push.ps1
   ```

## 🔧 Configuration Steps

### 1. Update deploy.yml
Replace `YOUR_USERNAME` in `deploy.yml` with your GitHub username:

```yaml
services:
  minebench-ui:
    image: ghcr.io/YOUR_USERNAME/minebench-ui:latest
```

### 2. Make Image Public
1. Go to your GitHub repository
2. Click on "Packages" tab
3. Find your `minebench-ui` package
4. Click "Package settings"
5. Scroll down to "Danger Zone"
6. Click "Change visibility" → "Public"

## 🌐 Deploy to Akash

### 1. Create Deployment
```bash
# Create deployment from deploy.yml
akash tx deployment create deploy.yml --from mykey --fees 5000uakt

# This will return a deployment ID (dseq)
```

### 2. Find Providers
```bash
# Query available providers
akash query provider list

# Or get providers for your deployment
akash query deployment get --owner $(akash keys show mykey -a) --dseq <dseq>
```

### 3. Create Lease
```bash
# Create lease with a provider
akash tx market lease create --owner $(akash keys show mykey -a) --dseq <dseq> --gseq 1 --oseq 1 --provider <provider-address> --from mykey --fees 5000uakt
```

### 4. Send Manifest
```bash
# Send manifest to provider
akash provider send-manifest deploy.yml --owner $(akash keys show mykey -a) --dseq <dseq> --provider <provider-address>
```

### 5. Get Service URL
```bash
# Get service URL
akash provider lease-status --owner $(akash keys show mykey -a) --dseq <dseq> --provider <provider-address>
```

## 🔍 Monitoring Your Deployment

### Check Deployment Status
```bash
# Check deployment status
akash query deployment get --owner $(akash keys show mykey -a) --dseq <dseq>

# Check lease status
akash query market lease get --owner $(akash keys show mykey -a) --dseq <dseq> --gseq 1 --oseq 1 --provider <provider-address>
```

### View Logs
```bash
# View application logs
akash provider lease-logs --owner $(akash keys show mykey -a) --dseq <dseq> --provider <provider-address>
```

### Update Deployment
```bash
# Update deployment (if you made changes)
akash tx deployment update deploy.yml --from mykey --fees 5000uakt --dseq <dseq>
```

## 💰 Cost Management

### Current Pricing
- **CPU**: 0.5 units
- **Memory**: 512Mi
- **Storage**: 1Gi
- **Price**: 1000 uakt per block (~6 seconds)

### Estimated Monthly Cost
- Approximately 4,320,000 uakt per month
- At $0.10 per AKT: ~$432/month
- At $0.01 per AKT: ~$43/month

### Adjust Pricing
Edit `deploy.yml` to change pricing:
```yaml
placement:
  akash:
    pricing:
      minebench-ui:
        denom: uakt
        amount: 500  # Reduce to 500 uakt for lower cost
```

## 🛠️ Troubleshooting

### Common Issues

1. **Image not found**
   - Ensure image is public in GitHub Packages
   - Check image name and tag are correct

2. **Deployment failed**
   - Check resource requirements
   - Verify provider has enough capacity

3. **Service not accessible**
   - Check lease status
   - Verify port configuration

### Useful Commands
```bash
# List all deployments
akash query deployment list --owner $(akash keys show mykey -a)

# Close deployment
akash tx deployment close --owner $(akash keys show mykey -a) --dseq <dseq> --from mykey --fees 5000uakt

# Check account balance
akash query bank balances $(akash keys show mykey -a)
```

## 🔄 Automated Deployment Script

Create a deployment script for easier management:

```bash
#!/bin/bash
# deploy-to-akash.sh

DEPLOYMENT_FILE="deploy.yml"
KEY_NAME="mykey"

echo "🚀 Deploying Minebench UI to Akash..."

# Create deployment
echo "📦 Creating deployment..."
DEPLOYMENT_OUTPUT=$(akash tx deployment create $DEPLOYMENT_FILE --from $KEY_NAME --fees 5000uakt --output json)
DSEQ=$(echo $DEPLOYMENT_OUTPUT | jq -r '.events[0].attributes[0].value')

echo "✅ Deployment created with DSEQ: $DSEQ"

# Wait for providers
echo "⏳ Waiting for providers..."
sleep 10

# Get providers
PROVIDERS=$(akash query deployment get --owner $(akash keys show $KEY_NAME -a) --dseq $DSEQ --output json | jq -r '.groups[0].group_spec.resources[0].resources.endpoints[0].kind')

echo "🔍 Found providers, creating lease..."

# Create lease (you'll need to select a provider manually)
echo "Please select a provider and create lease manually:"
echo "akash tx market lease create --owner \$(akash keys show $KEY_NAME -a) --dseq $DSEQ --gseq 1 --oseq 1 --provider <provider-address> --from $KEY_NAME --fees 5000uakt"

echo "📋 Deployment DSEQ: $DSEQ"
echo "🔗 Next steps:"
echo "   1. Create lease with selected provider"
echo "   2. Send manifest: akash provider send-manifest $DEPLOYMENT_FILE --owner \$(akash keys show $KEY_NAME -a) --dseq $DSEQ --provider <provider-address>"
echo "   3. Get service URL: akash provider lease-status --owner \$(akash keys show $KEY_NAME -a) --dseq $DSEQ --provider <provider-address>"
```

## 📚 Additional Resources

- [Akash Documentation](https://docs.akash.network/)
- [Akash CLI Reference](https://docs.akash.network/cli/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Akash Provider List](https://github.com/akash-network/provider)

---

**🎉 Your Minebench UI is now ready for decentralized deployment on Akash!**
