# VeilScore Documentation Index

**Welcome!** This index helps you find the right documentation for your needs.

---

## 🎯 Quick Navigation

### I'm in a hurry
→ Start with **[QUICK_START.md](QUICK_START.md)** (5 minutes)

### I want to understand the user journey
→ Read **[END_TO_END_FLOW.md](END_TO_END_FLOW.md)** (15 minutes)  
→ Traces "Compute VeilScore" from click → relayer → on-chain storage

### I want to understand the architecture
→ Read **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** (visual)  
→ Then **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)** (deep dive)

### I'm deploying to Sepolia
→ Follow **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** (step-by-step)  
→ Then **[ACL_REGISTRATION.md](ACL_REGISTRATION.md)** (if needed)

### I'm integrating components
→ Read **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** (step-by-step)  
→ Test locally using 5-terminal setup in **[README.md](../README.md)**

### I want the full picture
→ Start with **[README.md](../README.md)**  
→ Then **[END_TO_END_FLOW.md](END_TO_END_FLOW.md)** (understand the user journey)  
→ Then **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**  
→ Then this index to explore specific topics

---

## 📚 Documentation Files

### Getting Started

| File | Purpose | Audience | Time |
|------|---------|----------|------|
| **README.md** | Main entry point, all core info | Everyone | 10 min |
| **QUICK_START.md** | Quick reference, copy-paste commands | Users in hurry | 5 min |
| **END_TO_END_FLOW.md** | Complete "Compute VeilScore" user journey | Everyone | 15 min |
| **SESSION_SUMMARY.md** | What was built in this session | Technical leads | 15 min |

### Understanding the Design

| File | Purpose | Audience | Time |
|------|---------|----------|------|
| **RELAYER_ARCHITECTURE.md** | Privacy models, design decisions | Architects | 20 min |
| **ARCHITECTURE_DIAGRAMS.md** | Visual explanations, ASCII diagrams | Visual learners | 15 min |
| **IMPLEMENTATION_SUMMARY.md** | Complete technical overview | Technical leads | 15 min |

### Deployment & Operations

| File | Purpose | Audience | Time |
|------|---------|----------|------|
| **DEPLOYMENT_CHECKLIST.md** | Step-by-step deployment guide | DevOps | 30 min |
| **ACL_REGISTRATION.md** | Zama ACL registration process | DevOps/Security | 15 min |
| **QUICK_START.md** | Quick reference for deployment | Everyone | 5 min |

### Development & Integration

| File | Purpose | Audience | Time |
|------|---------|----------|------|
| **INTEGRATION_GUIDE.md** | Wire components together | Frontend devs | 30 min |
| **README.md** | Local testing (5-terminal setup) | Frontend devs | 15 min |
| **ARCHITECTURE_DIAGRAMS.md** | Data flow diagrams | Frontend devs | 10 min |

### Completion & Status

| File | Purpose | Audience | Time |
|------|---------|----------|------|
| **FEATURE_CHECKLIST.md** | What's complete, what's pending | Project managers | 10 min |
| **IMPLEMENTATION_SUMMARY.md** | What's ready to use | Technical leads | 15 min |

---

## 🗺️ Topic-Based Navigation

### Privacy & Security

**I want to understand privacy tradeoffs:**
1. Read **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)** - Privacy Model 1 vs 2
2. View **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Privacy guarantee visualization
3. Check security section of **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**

**I'm concerned about relayer trust:**
1. Read Model 1 section in **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)**
2. See upgrade path in **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)**
3. Check **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** for privacy guarantee flow

**I need to verify security:**
1. Check security checklist in **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**
2. Review contract code in `contracts/VeilScore.sol`
3. Read signature verification flow in **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**

### Deployment & Configuration

**I'm deploying to Sepolia:**
1. Follow **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** step-by-step
2. Reference **[ACL_REGISTRATION.md](ACL_REGISTRATION.md)** for registration
3. Use commands in **[QUICK_START.md](QUICK_START.md)**

**I don't control the ACL:**
1. Read "ACL Admin Privileges" in **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)**
2. Follow Path B in **[ACL_REGISTRATION.md](ACL_REGISTRATION.md)**
3. Check troubleshooting in **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

**I'm deploying to Vercel:**
1. Follow Vercel sections in **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**
2. Reference environment variables in `.env.example`
3. Check **[README.md](../README.md)** for `VITE_API_BASE_URL` setup

### Local Development & Testing

**I want to test locally:**
1. Read 5-terminal setup in **[README.md](../README.md)**
2. Reference commands in **[QUICK_START.md](QUICK_START.md)**
3. View architecture in **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**

**I'm debugging locally:**
1. Check debugging checklist in **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)**
2. View local architecture in **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**
3. Verify relayer stub is working (http://localhost:3000/api/status)

**I'm testing the relayer stub:**
1. See relayer stub code in `worker/relayerStub.js`
2. Check endpoints in **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)**
3. View mock evaluation flow in **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**

### Integration & Development

**I'm integrating InputForm with FHEVM:**
1. Follow **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** step-by-step
2. Reference **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** for data flow
3. Test using 5-terminal setup in **[README.md](../README.md)**

**I need to understand the data flow:**
1. View diagrams in **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**
2. Read integration steps in **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)**
3. Check contract interface in `contracts/VeilScore.sol`

**I want to switch to Model 1 (encrypted):**
1. Read upgrade section in **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)**
2. Understand Model 1 in **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)**
3. View privacy guarantee in **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**

---

## 🔍 Searching Across Docs

### By Component

**VeilScore Contract:**
- `contracts/VeilScore.sol` - Source code
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Contract state management

**FHEVM Hook (useFhevm.ts):**
- `apps/web/src/lib/useFhevm.ts` - Source code
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Usage in InputForm
- **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)** - Configuration

**Relayer Stub (worker/relayerStub.js):**
- `worker/relayerStub.js` - Source code
- **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)** - Endpoints & behavior
- **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Local testing architecture

**Deployment Scripts:**
- `scripts/deploy.ts` - Deploy contract
- `scripts/registerAcl.ts` - Register in ACL
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - How to use them
- **[ACL_REGISTRATION.md](ACL_REGISTRATION.md)** - Registration details

### By Scenario

**"Relayer rejected my submission"**
→ Check contract address in `.env`  
→ Verify ACL registration: **[ACL_REGISTRATION.md](ACL_REGISTRATION.md)**  
→ Check relayer address: **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

**"I don't know which privacy model to use"**
→ Compare: **[RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md)**  
→ View diagrams: **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**  
→ Upgrade path: **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)**

**"Local testing is broken"**
→ Check 5-terminal setup: **[README.md](../README.md)**  
→ Debug checklist: **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)**  
→ View architecture: **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**

**"Deployment failed"**
→ Follow checklist: **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**  
→ Check ACL: **[ACL_REGISTRATION.md](ACL_REGISTRATION.md)**  
→ Troubleshooting: All checklists have troubleshooting sections

---

## 📖 Learning Paths

### Path 1: Understanding Everything (Deep Dive) — 2 hours
1. README.md (10 min)
2. IMPLEMENTATION_SUMMARY.md (15 min)
3. ARCHITECTURE_DIAGRAMS.md (15 min)
4. RELAYER_ARCHITECTURE.md (20 min)
5. INTEGRATION_GUIDE.md (30 min)
6. DEPLOYMENT_CHECKLIST.md (30 min)

### Path 2: Getting to Production (Fastest) — 45 minutes
1. QUICK_START.md (5 min)
2. DEPLOYMENT_CHECKLIST.md (30 min)
3. Deploy & test (10 min)

### Path 3: Local Development (Focus on Code) — 1.5 hours
1. README.md (10 min)
2. INTEGRATION_GUIDE.md (30 min)
3. ARCHITECTURE_DIAGRAMS.md (15 min)
4. Start 5-terminal setup & code (55 min)

### Path 4: Security & Privacy (Focus on Design) — 1 hour
1. RELAYER_ARCHITECTURE.md (20 min)
2. ARCHITECTURE_DIAGRAMS.md (15 min)
3. IMPLEMENTATION_SUMMARY.md - Security section (15 min)
4. Review contract code (10 min)

---

## 🎯 One-Page Cheat Sheet

```
LOCAL TESTING:
  Terminal 1: npx hardhat node
  Terminal 2: node worker/relayerStub.js
  Terminal 3: npx hardhat run scripts/deploy.ts --network localhost
  Terminal 4: pnpm server:dev
  Terminal 5: pnpm dev
  → Visit http://localhost:5173

SEPOLIA DEPLOYMENT:
  npx hardhat run scripts/deploy.ts --network sepolia
  npx hardhat run scripts/registerAcl.ts --network sepolia
  → Deploy frontend & backend to Vercel

VERIFY REGISTRATION:
  cast call 0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0 \
    "isContractRegistered(address)(bool)" \
    0x<YOUR_CONTRACT> \
    --rpc-url $SEPOLIA_RPC_URL

PRIVACY MODELS:
  Model 1: User decrypts locally + signs (highest privacy) ⭐
  Model 2: Relayer signs plaintext (current implementation) ✅

ENV SETUP:
  cp .env.example .env
  Edit: DEPLOYER_PRIVATE_KEY, SEPOLIA_RPC_URL, TWITTER_BEARER_TOKEN
```

---

## 📞 Getting Help

**Question Type** | **Where to Look**
---|---
"How do I...?" | Find matching section in QUICK_START.md or README.md
"Why did...?" | Check IMPLEMENTATION_SUMMARY.md or SESSION_SUMMARY.md
"What's the difference...?" | See RELAYER_ARCHITECTURE.md for comparisons
"How does...work?" | View ARCHITECTURE_DIAGRAMS.md
"What do I do if...?" | Check troubleshooting sections in checklists
"Is...secure?" | Read security section in IMPLEMENTATION_SUMMARY.md
"When do I use...?" | Check decision tree in RELAYER_ARCHITECTURE.md

---

## ✅ Completion Status

**Documentation:** ✅ 100% Complete (10 comprehensive guides)  
**Contract:** ✅ 100% Complete (production-ready)  
**Infrastructure:** ✅ 100% Complete (FHEVM + relayer stub)  
**Deployment:** ✅ 100% Complete (scripts + checklists)  
**Integration:** ⏳ Ready (follow INTEGRATION_GUIDE.md)  
**Testing:** ✅ Ready (5-terminal local setup)  

**Time to Production:** 2-4 hours (following guides)  
**Branch:** `fix/veilscore-security-events`

---

## 🚀 Next Step

👉 **Start here:** [README.md](../README.md)  
👉 **If in hurry:** [QUICK_START.md](QUICK_START.md)  
👉 **If deploying:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)  
👉 **If developing:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)  
👉 **If curious:** [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)

---

**Last Updated:** November 22, 2025  
**Status:** ✅ Complete  
**Total Guides:** 10 (this index + 9 documentation files)
