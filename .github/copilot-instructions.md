# Copilot Instructions for `veilscore-fhevm`

These guidelines help AI coding agents work effectively in this repo.

## Project Overview

- **Purpose:** Private reputation oracle (VeilScore) using FHEVM so client-side encrypted signals are aggregated into a single private score and used for on-chain threshold gating.
- **Context:** Intended to align with the Zama Developer Program Builder Track and likely built on Zama's FHEVM stack (Solidity + FHE precompiles, toolchain, and devnet).
- **High-level flow:**
  - Off-chain/client collects user signals and encrypts them.
  - Encrypted signals are processed inside an FHEVM-compatible environment to compute a score.
  - Only the final score / threshold result is revealed to on-chain contracts (no raw signals).

## Architecture & Code Organization

> NOTE: The repo is currently a skeleton with only `README.md`. When adding new code, follow these conventions so future agents have a consistent structure.

- **Smart contracts:**
  - Place FHEVM contracts under `contracts/` (e.g., `contracts/VeilScore.sol`).
  - Keep on-chain logic minimal: storage of encrypted data references, FHE precompile calls, threshold checks, and event emission.
  - Separate **FHE-specific logic** (ciphertext ops, key handling, precompile wrappers) into a small library contract (e.g., `contracts/lib/FHEVeilLib.sol`).
- **Client / off-chain:**
  - Place any client apps in `apps/` or `frontend/` (e.g., `apps/web/`).
  - Keep encryption, signal collection, and score submission in well-named modules (e.g., `src/fhe/encryptSignals.ts`, `src/fhe/computeScore.ts`).
- **Services / scripts:**
  - Put one-off scripts (deployment, test harness, score simulation) in `scripts/`.
  - Distinguish clearly between **devnet/demo scripts** and **production flows** via filenames (`*-devnet.ts`, `*-prod.ts`).

## FHEVM & Privacy-Specific Conventions

- **Never log raw signals:** Avoid printing or persisting raw user signals; only log encrypted payloads, anonymized aggregates, or scores.
- **Encapsulate encryption:** Wrap all encryption/decryption calls in a small utility layer (e.g., `fheEncrypt`, `fheDecrypt`) instead of scattering direct API calls.
- **Separation of concerns:**
  - Client: collects signals, encrypts, prepares transactions.
  - Contracts: validate ciphertext shape, call FHE ops, enforce thresholds.
  - Off-chain services (if any): coordinate key distribution, policy management.
- **Threshold gating:** Implement score thresholds as clearly named constants or config (e.g., `MIN_VEILSCORE_FOR_ACCESS`) and keep comparison logic in a single place in the main contract.

## Workflows (Expected Defaults)

> Adjust these once the actual toolchain is added (e.g., Hardhat, Foundry, or Truffle). For now, follow these expectations when creating scripts/configs so future agents can infer behavior.

- **Node / package manager:** Prefer `pnpm` or `yarn` over `npm` for monorepos. Use consistent scripts in `package.json`:
  - `dev` – run local FHEVM devnet and watcher.
  - `test` – run contract + integration tests.
  - `lint` – run linters/formatters.
- **Contracts toolchain:**
  - If using **Hardhat**, keep config in `hardhat.config.ts` and expose scripts `npx hardhat test`, `npx hardhat node`, `npx hardhat run scripts/deploy.ts`.
  - If using **Foundry**, use `forge test`, `forge script`, and place contracts under `src/` with tests under `test/`.
- **Frontend:**
  - If you create a Next.js app, expose `pnpm dev` / `yarn dev` and keep FHE-specific logic under a dedicated folder (`src/lib/fhe/`).

## Patterns for New Code

- **Explicit types:** Use TypeScript for any new scripts or frontends. Avoid `any`; type FHE ciphertext, score, and threshold types (e.g., `EncryptedScore`, `VeilScore`, `ThresholdConfig`).
- **Config-driven:** Pull network IDs, key material references, and threshold parameters from config files (e.g., `config/networks.ts`, `.env`) instead of hardcoding.
- **Test strategy:**
  - Start with deterministic unit tests for scoring and threshold logic.
  - Add at least one **end-to-end** path: client encrypts → contract computes → threshold gate passes/fails.

## How AI Agents Should Work Here

- Prefer **minimal, focused changes** in existing files rather than large refactors.
- When introducing FHEVM or Zama tooling, add clear comments near the first usage and reference upstream docs (URL string only, no large quotes).
- When you create new top-level components (contract, app, or script), also add a short note to `README.md` describing what it does and how to run it.
- If you add non-obvious commands (custom scripts, devnet runners), document them under a `## Development` or `## Scripts` section in `README.md`.

## Open Questions for Maintainers

- What FHEVM toolchain (Hardhat + Zama plugin, Foundry, etc.) and network(s) should be considered canonical?
- Are there preferred languages/frameworks for the client (e.g., Next.js + wagmi, plain React, CLI only)?
- Where should long-lived key management and policy configuration live (separate repo, `config/`, on-chain)?

Please update this file as the repo evolves so future AI agents can rely on it for accurate, project-specific guidance.