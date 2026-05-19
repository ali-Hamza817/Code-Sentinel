import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';

export class ExecutionService {
  async runBuild(projectPath: string, onData: (data: string) => void): Promise<number> {
    return new Promise((resolve) => {
      // Find package manager
      const hasYarn = fs.existsSync(path.join(projectPath, 'yarn.lock'));
      const cmd = hasYarn ? 'yarn' : 'npm';
      const args = ['install'];

      onData(`> Running ${cmd} ${args.join(' ')}...\n`);
      
      const child = spawn(cmd, args, { 
        cwd: projectPath, 
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      child.stdout.on('data', (data) => onData(data.toString()));
      child.stderr.on('data', (data) => onData(data.toString()));

      child.on('close', (code) => {
        onData(`\n> Build cycle completed with code ${code}\n`);
        resolve(code || 0);
      });
    });
  }

  async dockerBuild(projectId: string, projectPath: string, onData: (data: string) => void): Promise<number> {
    return new Promise(async (resolve) => {
      const dockerfilePath = path.join(projectPath, 'Dockerfile');
      
      // Auto-generate a generic Node.js Dockerfile if missing
      if (!fs.existsSync(dockerfilePath)) {
        onData(`> No Dockerfile found. Generating generic Node.js environmental container...\n`);
        const genericDockerfile = `
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
        `;
        await fs.writeFile(dockerfilePath, genericDockerfile.trim());
      }

      const tag = `codesentinel-${projectId}`.toLowerCase();
      const startTime = Date.now();
      onData(`> Building Docker image: ${tag}...\n`);

      const child = spawn('docker', ['build', '-t', tag, '.'], { 
        cwd: projectPath, 
        shell: true 
      });

      child.stdout.on('data', (data) => onData(data.toString()));
      child.stderr.on('data', (data) => onData(data.toString()));

      child.on('close', (code) => {
        const buildTime = Date.now() - startTime;
        onData(`\n> Build completed in ${(buildTime / 1000).toFixed(2)}s\n`);
        resolve(code || buildTime); // Resolving with time if success
      });
    });
  }

  async dockerRun(projectId: string, onData: (data: string) => void): Promise<string> {
    const tag = `codesentinel-${projectId}`.toLowerCase();
    const containerName = `codesentinel-sandbox-${projectId}`;

    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      // Clean up existing container if any
      spawn('docker', ['rm', '-f', containerName], { shell: true }).on('close', () => {
        // Map common development ports to host
        const portMappings = ['-p', '3000:3000', '-p', '5000:5000', '-p', '5001:5001', '-p', '8000:8000', '-p', '8080:8080'];
        const child = spawn('docker', ['run', '--name', containerName, ...portMappings, '-d', tag], { shell: true });
        
        child.on('close', (code) => {
          if (code === 0) {
            const runTime = Date.now() - startTime;
            onData(`> Sandbox container started in ${(runTime / 1000).toFixed(2)}s: ${containerName}\n`);
            resolve(JSON.stringify({ containerName, runTime }));
          } else {
            reject(new Error(`Docker run failed with code ${code}`));
          }
        });
      });
    });
  }

  async dockerStop(projectId: string) {
    const containerName = `codesentinel-sandbox-${projectId}`;
    return new Promise((resolve) => {
        spawn('docker', ['stop', containerName], { shell: true }).on('close', () => {
            spawn('docker', ['rm', containerName], { shell: true }).on('close', resolve);
        });
    });
  }

  /**
   * Builds and runs a Docker container for a SINGLE uploaded source file.
   * Auto-generates a language-appropriate Dockerfile.
   */
  async dockerBuildSingleFile(
    projectId: string,
    sourceFilePath: string,
    onData: (data: string) => void
  ): Promise<{ runTime: number; containerName: string; previewPort: number }> {
    const fileName   = path.basename(sourceFilePath);
    const ext        = path.extname(fileName).toLowerCase();
    const workDir    = path.join(app.getPath('userData'), 'singlefile-sandboxes', projectId);
    await fs.ensureDir(workDir);
    await fs.copy(sourceFilePath, path.join(workDir, fileName));

    // ── Language-specific Dockerfile generation ──────────────────────────────
    const dockerfileContent = this.generateSingleFileDockerfile(ext, fileName);
    await fs.writeFile(path.join(workDir, 'Dockerfile'), dockerfileContent);
    onData(`> Generated ${ext} Dockerfile for ${fileName}\n`);

    const tag           = `codesentinel-single-${projectId}`.toLowerCase();
    const containerName = `codesentinel-sf-${projectId}`;
    const startTime     = Date.now();

    // Build image
    await new Promise<void>((resolve, reject) => {
      const build = spawn('docker', ['build', '-t', tag, '.'], { cwd: workDir, shell: true });
      build.stdout.on('data', d => onData(d.toString()));
      build.stderr.on('data', d => onData(d.toString()));
      build.on('close', code => code === 0 ? resolve() : reject(new Error(`Build failed: ${code}`))); 
    });
    onData(`> Image built in ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);

    // Remove stale container
    await new Promise<void>(r => spawn('docker', ['rm', '-f', containerName], { shell: true }).on('close', () => r()));

    // Run with full port mapping
    const ports = ['-p','3000:3000','-p','5000:5000','-p','5001:5001','-p','8000:8000','-p','8080:8080'];
    const runTime = await new Promise<number>((resolve, reject) => {
      const run = spawn('docker', ['run', '--name', containerName, ...ports, '-d', tag], { shell: true });
      run.on('close', code => {
        if (code === 0) { resolve(Date.now() - startTime); }
        else reject(new Error(`Container run failed: ${code}`));
      });
    });
    onData(`> Container running: ${containerName} (${(runTime / 1000).toFixed(2)}s)\n`);
    return { runTime, containerName, previewPort: 5001 };
  }

  private generateSingleFileDockerfile(ext: string, fileName: string): string {
    const name = path.basename(fileName, ext);
    switch (ext) {
      case '.py':
        return [
          'FROM python:3.11-slim',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          'RUN pip install flask requests numpy pandas 2>/dev/null || true',
          `CMD ["python", "${fileName}"]`
        ].join('\n');

      case '.js':
        return [
          'FROM node:20-slim',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `CMD ["node", "${fileName}"]`
        ].join('\n');

      case '.ts':
        return [
          'FROM node:20-slim',
          'WORKDIR /app',
          'RUN npm install -g tsx',
          `COPY ${fileName} .`,
          `CMD ["tsx", "${fileName}"]`
        ].join('\n');

      case '.java': {
        const mainClass = name.replace(/[^a-zA-Z0-9_]/g, '');
        return [
          'FROM eclipse-temurin:21-jdk-slim',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `RUN javac ${fileName}`,
          `CMD ["java", "${mainClass}"]`
        ].join('\n');
      }

      case '.cs':
        return [
          'FROM mcr.microsoft.com/dotnet/sdk:8.0',
          'WORKDIR /app',
          'RUN dotnet new console -n sandbox --force',
          `COPY ${fileName} sandbox/Program.cs`,
          'RUN dotnet build sandbox -c Release',
          'CMD ["dotnet", "run", "--project", "sandbox"]'
        ].join('\n');

      case '.go':
        return [
          'FROM golang:1.22-alpine',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `RUN go build -o out ${fileName}`,
          'CMD ["./out"]'
        ].join('\n');

      case '.c':
        return [
          'FROM gcc:13',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `RUN gcc -o out ${fileName}`,
          'CMD ["./out"]'
        ].join('\n');

      case '.cpp':
        return [
          'FROM gcc:13',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `RUN g++ -o out ${fileName}`,
          'CMD ["./out"]'
        ].join('\n');

      case '.rb':
        return [
          'FROM ruby:3.3-slim',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `CMD ["ruby", "${fileName}"]`
        ].join('\n');

      case '.php':
        return [
          'FROM php:8.3-cli',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `CMD ["php", "${fileName}"]`
        ].join('\n');

      default:
        return [
          'FROM ubuntu:22.04',
          'WORKDIR /app',
          `COPY ${fileName} .`,
          `CMD ["cat", "${fileName}"]`
        ].join('\n');
    }
  }

  async getDockerStats(projectId: string): Promise<any> {
    const containerName = `codesentinel-sandbox-${projectId}`;
    return new Promise((resolve) => {
      const child = spawn('docker', ['stats', containerName, '--no-stream', '--format', '{"cpu": "{{.CPUPerc}}", "mem": "{{.MemPerc}}", "memUsage": "{{.MemUsage}}"}'], { shell: true });
      
      let output = '';
      child.stdout.on('data', (data) => output += data.toString());
      child.on('close', () => {
        try {
          resolve(JSON.parse(output.trim()));
        } catch {
          resolve({ cpu: '0%', mem: '0%', memUsage: '0B / 0B' });
        }
      });
    });
  }

  async ensureOllamaContainer(): Promise<string> {
    const containerName = 'codesentinel-ai';
    return new Promise((resolve, reject) => {
      // Check if container already exists
      const check = spawn('docker', ['inspect', containerName], { shell: true });
      check.on('close', (code) => {
        if (code === 0) {
          // Exists, make sure it's running
          spawn('docker', ['start', containerName], { shell: true }).on('close', () => resolve('running'));
        } else {
          // Doesn't exist, create and run
          const run = spawn('docker', ['run', '-d', '-v', 'ollama:/root/.ollama', '-p', '11434:11434', '--name', containerName, 'ollama/ollama'], { shell: true });
          run.on('close', (runCode) => {
            if (runCode === 0) resolve('started');
            else reject(new Error('Failed to start Ollama container. Ensure Docker is running.'));
          });
        }
      });
    });
  }

  async pullModelInContainer(model: string, onData?: (data: string) => void): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn('docker', ['exec', 'codesentinel-ai', 'ollama', 'pull', model], { shell: true });
      
      child.stdout.on('data', (data) => onData?.(data.toString()));
      child.stderr.on('data', (data) => onData?.(data.toString()));
      
      child.on('close', (code) => {
        resolve(code || 0);
      });
    });
  }
}
