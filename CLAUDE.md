# MantlePredict - Claude Code Notes

## Project Overview
Decentralized prediction market for RWA events on Mantle Network.
- **Live URL**: https://mantlepredict.com
- **GitHub**: https://github.com/decentrathai/mantle-predict
- **Network**: Mantle Sepolia Testnet (Chain ID: 5003)

## How to Start the Project After Laptop Restart

The project requires TWO services to be running:

### 1. Start the Next.js Frontend Server
```bash
cd /home/yourt/mantle-predict/frontend
nohup npx next start -p 3001 > /tmp/mantlepredict.log 2>&1 &
```

### 2. Start the Cloudflare Tunnel
```bash
cloudflared tunnel run zchat > /tmp/cloudflared.log 2>&1 &
```

### Verify Everything is Working
```bash
# Check server is responding
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
# Should return: 200

# Check tunnel connections
cloudflared tunnel list
# Should show connections with recent timestamp
```

## Common Issues & Solutions

### Issue: "Bad Gateway" or "Error 1033" on mantlepredict.com

**Cause**: After laptop restart, both the Next.js server and Cloudflare tunnel stop running. The tunnel needs to be explicitly restarted - just having cloudflared process running is not enough, it needs active connections.

**Solution**:
1. Kill any existing cloudflared process: `pkill -9 cloudflared`
2. Restart the tunnel: `cloudflared tunnel run zchat > /tmp/cloudflared.log 2>&1 &`
3. Wait 5 seconds for connections to establish
4. Check logs: `tail -20 /tmp/cloudflared.log` - should show "Registered tunnel connection" messages

### Issue: Server stops after terminal closes

**Cause**: Background processes (`&`) get killed when terminal session ends.

**Solution**: Use `nohup` to persist the process:
```bash
nohup npx next start -p 3001 > /tmp/mantlepredict.log 2>&1 &
```

### Issue: Need to rebuild after code changes

```bash
cd /home/yourt/mantle-predict/frontend
npm run build
fuser -k 3001/tcp  # Kill existing server
nohup npx next start -p 3001 > /tmp/mantlepredict.log 2>&1 &
```

## Tunnel Configuration

Config file: `~/.cloudflared/config.yml`

The tunnel `zchat` routes:
- `mantlepredict.com` → `http://localhost:3001`
- `www.mantlepredict.com` → `http://localhost:3001`

## Deployed Contracts (Mantle Sepolia)

- **MarketFactory**: 0xa91FcC187e67118fdFAe556A885Bb8695408F062
- **PriceOracle**: 0x97071685437B7210c6a9e47bB360C56E8b43497c
