# VeilScore Architecture Diagram

## Privacy Models: Visual Comparison

### Model 1: Encrypted Result (Highest Privacy) ⭐

```
┌──────────────────────────────────────────────────────────────────┐
│ User's Browser                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ InputForm.tsx                                              │  │
│ │ 1. Collect signals (followers, tx count)                  │  │
│ │ 2. Encrypt tier with user's public key                    │  │
│ │ 3. Send encryptedTier to relayer                          │  │
│ └───────────┬────────────────────────────────────────────────┘  │
│             │ POST /api/evaluate { encrypted_input }            │
└─────────────┼──────────────────────────────────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────────────┐
│ Zama Relayer (FHEVM)                                            │
│ 1. Receive encrypted input                                      │
│ 2. Compute inside FHEVM (plaintext never exposed)              │
│ 3. Encrypt result with FHEVM public key                        │
│ 4. Return ENCRYPTED boolean (relayer cannot read)              │
│ 5. Return encrypted commitment + encrypted result             │
└────────────┬─────────────────────────────────────────────────┘
             │ Response { encrypted_result, commitment }
┌────────────▼──────────────────────────────────────────────────┐
│ User's Browser                                                  │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ 1. Decrypt result locally (ONLY USER HAS PRIVATE KEY)   │  │
│ │ 2. User signs: sign(commitment, decrypted_boolean)      │  │
│ │ 3. Submit (commitment, boolean, user_signature) to      │  │
│ │    contract                                              │  │
│ └──────────────────────────────────────────────────────────┘  │
│ ✅ Privacy guaranteed: relayer never sees plaintext            │
│ ✅ Contract trust: verifies user's signature                   │
│ ✅ Audit trail: commitment stored but not decryptable          │
└──────────────────────────────────────────────────────────────┘
```

**Best for:** Production, privacy-sensitive reputation, regulatory compliance

### Model 2: Relayer-Signed Boolean (Current) ✅

```
┌──────────────────────────────────────────────────────────────────┐
│ User's Browser                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ InputForm.tsx                                              │  │
│ │ 1. Collect signals (followers, tx count)                  │  │
│ │ 2. Encrypt tier (simulated or real)                       │  │
│ │ 3. Send to relayer                                        │  │
│ └───────────┬────────────────────────────────────────────────┘  │
│             │ POST /api/evaluate { encrypted_input }            │
└─────────────┼──────────────────────────────────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────────────┐
│ Zama Relayer (FHEVM) or Local Stub                             │
│ 1. Receive encrypted input                                      │
│ 2. Decrypt + compute inside FHEVM                              │
│ 3. Get PLAINTEXT result (allowed = true/false)                 │
│ 4. Sign: relayer_sig = sign(commitment, plaintext_allowed)     │
│ 5. Return (commitment, plaintext, signature)                   │
│ ⚠️  Relayer sees and signs the plaintext result                 │
└────────────┬─────────────────────────────────────────────────┘
             │ Response { commitment, allowed, signature }
┌────────────▼──────────────────────────────────────────────────┐
│ User's Browser → Smart Contract                                 │
│ 1. Call submitWithSig(commitment, allowed, relayerSig)         │
│ 2. Contract verifies signature (signer == relayerAddress)      │
│ 3. If valid, store entry                                       │
│ ✅ Simple: just verify relayer's signature                     │
│ ⚠️  Plaintext visible on-chain                                 │
│ ⚠️  Relayer is trusted authority                                │
└──────────────────────────────────────────────────────────────┘
```

**Best for:** MVP, demos, internal testing, full automation

---

## Local Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Your Computer (5 Terminals)                                     │
│                                                                 │
│ Terminal 1:   Terminal 2:       Terminal 3:                    │
│ ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│ │Hardhat   │  │Relayer Stub  │  │Deploy + Run Tests       │   │
│ │Node      │  │Express       │  │hardhat scripts/deploy.ts│   │
│ │Port 8545 │  │Port 3000     │  │                         │   │
│ └─────────┬┘  └────────┬─────┘  └────────┬────────────────┘   │
│           │           │                  │                    │
│ chainId   │ Simulates │                  │ VeilScore          │
│ 31337     │ FHEVM     │                  │ deployed           │
│           │           │                  │ to 31337           │
│           │           │                  │                    │
│ Terminal 4:            │   Terminal 5:   │                    │
│ ┌──────────────────┐   │   ┌───────────┐ │                    │
│ │Backend API       │   │   │Frontend   │ │                    │
│ │Signal Fetching   │   │   │Vite React │ │                    │
│ │Port 4000         │   │   │Port 5173  │ │                    │
│ └─────────┬────────┘   │   └─────┬─────┘ │                    │
│           │            │         │       │                    │
│ Twitter   │            │    mockChains   │                    │
│ APIs      │            │    mapping:     │                    │
│           │            │    31337 →      │                    │
│           │            │    http://      │                    │
│           │            │    localhost:   │                    │
│           │            └    3000         │                    │
│           │                 ✅ Relayer  │                    │
│           │                    stub     │                    │
│           │                             │                    │
└─────────────────────────────────────────────────────────────────┘

Data Flow (User Action):
1. User enters Twitter handle + wallet in InputForm
2. Click "OnChain Imprints"
3. Frontend encrypts tier
4. Frontend calls http://localhost:3000/api/evaluate
5. Relayer stub returns signed result
6. Frontend calls contract.submitWithSig()
7. Transaction sent to Hardhat node (8545)
8. Entry stored in VeilScore
9. Success! 🎉
```

---

## Sepolia Deployment Flow

```
Local Development (5 Terminals)     →     Sepolia FHEVM (Production)
        ✅ Working                              🚀 Production

┌─────────────────┐                  ┌──────────────────────┐
│ Hardhat Node    │                  │ Sepolia FHEVM        │
│ localhost:8545  │────────────────→ │ Testnet              │
└─────────────────┘                  │ chainId: 11155111    │
                                     └──────────────────────┘

┌─────────────────┐                  ┌──────────────────────┐
│ Relayer Stub    │                  │ Zama Relayer         │
│ localhost:3000  │────────────────→ │ relayer.api.zama.ai  │
│ Mock evaluation │                  │ Real FHEVM compute   │
└─────────────────┘                  └──────────────────────┘

┌─────────────────┐                  ┌──────────────────────┐
│ Signal API      │                  │ Signal API           │
│ localhost:4000  │────────────────→ │ Vercel Serverless    │
│ Dev backend     │                  │ Production backend   │
└─────────────────┘                  └──────────────────────┘

┌─────────────────┐                  ┌──────────────────────┐
│ Frontend        │                  │ Frontend             │
│ localhost:5173  │────────────────→ │ Vercel Static Site   │
│ Dev UI          │                  │ Production UI        │
└─────────────────┘                  └──────────────────────┘

Deployment Commands:
  1. npx hardhat run scripts/deploy.ts --network sepolia
  2. npx hardhat run scripts/registerAcl.ts --network sepolia
  3. git push → Vercel auto-deploys
```

---

## Contract State Management

```
User Address (via msg.sender)
        │
        ▼
┌───────────────────────────────┐
│  entries[address] = {         │
│    owner: 0x...,              │
│    commitment: 0x...,         │  ← Encrypted signal hash
│    allowed: true/false,       │  ← Gate result (Model 2)
│    timestamp: 1700000000      │  ← When submitted
│  }                            │
└───────────────────────────────┘
        │
        ├─ Query via: getEntry(address)
        ├─ Check if exists: hasEntry(address)
        │
        ▼
    Stored On-Chain
    (Public but commitment is encrypted)
    
    Can be queried by:
    - User themselves (privacy preserved)
    - Any dApp (to verify gate result)
    - Off-chain indexers (for analytics)
```

---

## ACL & Authority Chain

```
Zama (Network Operator)
        │
        ├─ Deploys ACL Contract (Sepolia)
        │  address: 0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0
        │
        └─ Owns ACL admin role
           │
           └─ Can call registerContract(veilScoreAddress)
              │
              ├─ Path A: You have admin key
              │  → Run scripts/registerAcl.ts
              │  → Automatic registration ✅
              │
              └─ Path B: You don't have admin key
                 → Submit GitHub issue to Zama
                 → Zama admin registers manually
                 → Verify: cast call ... isContractRegistered()

Once Registered:
  Zama Relayer checks ACL before accepting evaluations
  If contract not in ACL → Relayer rejects with "Not in ACL"
  If contract in ACL → Relayer accepts evaluations ✅
```

---

## Signature Verification Flow

```
Relayer Signs:
  message = keccak256(abi.encodePacked(
    userAddress,
    commitment,
    allowed
  ))
  signature = sign(message) with RELAYER_PRIVATE_KEY

Contract Verifies:
  message = keccak256(abi.encodePacked(
    msg.sender,        ← User's address calling contract
    commitment,
    allowed
  ))
  
  // Add Ethereum message prefix (same as relayer did)
  ethSignedMessage = keccak256(
    "\x19Ethereum Signed Message:\n32" + message
  )
  
  recoveredSigner = ecrecover(ethSignedMessage, v, r, s)
  
  require(recoveredSigner == relayerAddress)  ✅ Signature valid!
  
Storage:
  entries[msg.sender] = Entry(...)
  emit EntrySubmitted(msg.sender, commitment, allowed, now)
```

---

## Privacy Guarantee (Model 1)

```
User's Private Key              Relayer
(Never leaves browser)          (Cannot read)
        │                           │
        ▼                           ▼
  decrypt(                   evaluate(
    encrypted_result              encrypted_input
  ) ✓                         ) → still_encrypted ✓
  plaintext_boolean              ✓ Can't read it
  
  User signs:                 Contract verifies:
  sign(                       verify_user_signature(
    commitment,        →        commitment,
    plaintext_boolean,          plaintext_boolean,
    user_private_key            user_public_key
  )                       )
  
  Plaintext never exposed to relayer ✓
  Commitment stored on-chain (encrypted, can't be decrypted) ✓
  Only user can decrypt the result ✓
```

---

**Diagram Version:** November 22, 2025  
**Models Documented:** Model 1 (Encrypted) + Model 2 (Relayer-Signed)  
**Architecture:** Local Dev (5 Terminal) + Sepolia Production Ready
