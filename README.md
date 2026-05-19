
  # CodeSentinel: An Open-Source Privacy-Preserving Hybrid Framework for Static, Dynamic, and LLM-Based Secure Code Analysis

  CodeSentinel is a desktop security auditing platform that combines:
  - Static code analysis
  - Sandboxed dynamic/runtime analysis
  - Local LLM-based semantic security reasoning

  All analysis is designed to run locally so source code does not need to leave the machine.

  ## Why This Project Matters

  Most tools focus on only one layer (static or dynamic). CodeSentinel integrates three complementary layers in one workflow:
  - Static pass for fast pattern-based findings
  - Dynamic pass in containers for runtime signals
  - LLM pass for higher-level logic and architectural security issues

  This supports both practical engineering audits and research-style evaluation.

  ## Core Stack

  - Desktop app: Electron + React + TypeScript
  - Local AI inference: Ollama
  - Persistence: SQLite
  - Sandboxing/runtime checks: Docker

  ## High-Level Architecture

  - Renderer process: UI and user workflow orchestration
  - Preload bridge: secure IPC interface between UI and backend
  - Main process: repository operations, AI calls, scan orchestration, persistence
  - Docker runtime: isolated build/run telemetry
  - Ollama runtime: local model inference for AI reviews

  ## Features Overview

  - Repository onboarding and file discovery
  - Static analysis screen for fast vulnerability indicators
  - AI Architect review for semantic reasoning over selected files
  - Dynamic analysis and container insights
  - Risk scoring and reporting views
  - Persistent audit data and chat history in SQLite

  ## Local Setup (Reviewer Quick Start)

  ### 1. Prerequisites

  Install the following on your machine:
  - Node.js 20+
  - npm 10+
  - Docker Desktop (or Docker Engine)
  - Git

  ### 2. Clone and Install

    git clone https://github.com/ali-Hamza817/CodeSentinel.git
    cd CodeSentinel
    npm install

  ### 3. Start Ollama in Docker

    docker run -d --name codesentinel-ai -p 11434:11434 ollama/ollama

  Pull a model (current app config uses llama3.2:latest):

    docker exec codesentinel-ai ollama pull llama3.2:latest

  ### 4. Run the App

    npm run dev

  Electron should launch automatically.

  ## Minimal Reproduction Protocol (5-10 Minutes)

  1. Open CodeSentinel and add a repository (or select a local project).
  2. Go to AI Architect and select a code file.
  3. Run Quick audit first, then Deep audit.
  4. Open Static Analysis and compare findings.
  5. Open Dynamic Analysis or Container Insights to view runtime behavior.
  6. Verify risk score and reports update.

  ## Expected Outputs

  - File-level findings with severity categories
  - AI-generated recommendations for remediation
  - Runtime and build telemetry from containerized execution
  - Persisted project results in local SQLite storage

  ## Project Structure

  - src/main: orchestration, AI service, execution service, repository service
  - src/preload: secure API bridge exposed to renderer
  - src/renderer: React UI, routes, screens, state management
  - build and release: packaging outputs

  ## Build for Distribution (Windows)

    npm run build:win

  Packaged artifacts are generated under release.

  ## Troubleshooting

  - Ollama model not found:

      docker exec codesentinel-ai ollama pull llama3.2:latest

  - Ollama not reachable on port 11434:

      docker ps

  - App starts but AI responses timeout:
    - Verify Docker is running
    - Verify the model is available
    - Retry with a shorter query on first run

  ## Reproducibility Notes

  - Runs fully on local infrastructure (local Docker + local Ollama)
  - No required cloud inference path
  - Suitable for privacy-sensitive codebases and repeatable reviewer validation

  ## License and Attribution

  See ATTRIBUTIONS.md for third-party attributions.

