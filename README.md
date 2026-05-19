# CodeSentinel

CodeSentinel is a desktop security auditing platform for analyzing source code with a hybrid workflow that combines static analysis, sandboxed runtime checks, and local LLM-based review. The product is designed for local-first use so code can remain on the machine during analysis.

## Overview

CodeSentinel helps teams inspect code from multiple angles in one place:

- Static analysis for fast pattern-based vulnerability detection
- Dynamic analysis for containerized runtime observation
- AI-assisted review for semantic security reasoning and remediation guidance

The result is a single workflow for finding security issues, understanding their impact, and tracking remediation progress.

## Key Features

- Repository onboarding and file discovery
- Static analysis for common security issues and risky patterns
- AI Architect review for file-level reasoning
- Dynamic analysis and container insights
- Risk scoring and reports
- Persistent local project data in SQLite
- Chat history and review context stored locally

## Technology Stack

- Electron
- React
- TypeScript
- Ollama
- Docker
- SQLite

## Architecture

- Main process: repository operations, analysis orchestration, persistence, and AI calls
- Preload bridge: secure IPC surface for renderer access
- Renderer process: application UI, navigation, and analysis screens
- Docker runtime: isolated execution and telemetry collection
- Ollama runtime: local model inference for AI review

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop or Docker Engine
- Git
- Ollama running locally with a supported model

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/ali-Hamza817/CodeSentinel.git
cd CodeSentinel
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Ollama

```bash
docker run -d --name codesentinel-ai -p 11434:11434 ollama/ollama
docker exec codesentinel-ai ollama pull llama3.2:latest
```

### 4. Run the application

```bash
npm run dev
```

## Usage

1. Open CodeSentinel.
2. Add a repository or select a local project.
3. Run static analysis to identify immediate findings.
4. Open AI Architect to review specific files.
5. Use dynamic analysis and container insights to validate runtime behavior.
6. Review risk scores and generated reports.

## Build

```bash
npm run build:win
```

Packaged artifacts are generated in the `release` directory.

## Project Structure

- `src/main`: orchestration, AI service, execution service, repository service
- `src/preload`: secure API bridge exposed to the renderer
- `src/renderer`: React UI, routes, screens, and state management
- `build` and `release`: packaging assets and build output

## Troubleshooting

- If Ollama is not reachable on port 11434, verify Docker is running and the container is active.
- If the model is missing, pull it again with `docker exec codesentinel-ai ollama pull llama3.2:latest`.
- If AI responses time out, retry with a smaller file or confirm the model is available locally.

## License and Use

Copyright (c) 2026 Ali Hamza. All rights reserved.

This repository is provided for non-commercial use only. Commercial use, redistribution for commercial purposes, or relicensing without permission is not allowed.

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party attributions.

