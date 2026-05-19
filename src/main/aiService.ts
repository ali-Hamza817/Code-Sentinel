import { Ollama } from 'ollama';

export interface AIReviewResult {
  file: string;
  line?: number;
  snippet: string;
  issue: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation: string;
}

export interface AIRendererResponse {
  findings: AIReviewResult[];
  measures: string[];
}

export class AIService {
  private model: string = 'llama3.2:latest'; // Using available model
  private client: Ollama;
  private modelConfirmedReady: boolean = false;
  private responseCache: Map<string, string> = new Map();
  private requestTimeout: number = 60000; // 60 second timeout

  constructor() {
    this.client = new Ollama({ host: 'http://127.0.0.1:11434' });
  }

  async isModelReady(): Promise<boolean> {
    if (this.modelConfirmedReady) return true;
    try {
      const list = await this.client.list();
      const found = (list.models || []).some((m: any) =>
        (m.name || '').includes('llama3.2') || (m.name || '').includes('llama2')
      );
      if (found) {
        this.modelConfirmedReady = true;
      }
      return found;
    } catch {
      return false;
    }
  }

  private getCacheKey(content: string, queryType: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(content + queryType).digest('hex');
    return `${queryType}:${hash.slice(0, 16)}`;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
  }

  private extractStructuredResponse(text: string): AIRendererResponse {
    let findings: AIReviewResult[] = [];
    let measures: string[] = [];

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.findings) findings = parsed.findings;
        if (parsed.measures) measures = parsed.measures;
      } catch {}
    }

    if (findings.length === 0) {
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) findings = parsed;
        } catch {}
      }
    }

    return { findings, measures: measures.slice(0, 5) };
  }

  async getSecurityReview(code: string, fileName: string, onChunk?: (chunk: string) => void): Promise<AIRendererResponse> {
    const ready = await this.isModelReady();
    if (!ready) return { findings: [], measures: [] };

    const ext = fileName.split('.').pop() || '';
    const lang = ext === 'cs' ? 'C#' : ext === 'py' ? 'Python' : 'JavaScript';
    
    const cacheKey = this.getCacheKey(code.slice(0, 2000), 'review');
    if (this.responseCache.has(cacheKey)) {
      console.log(`[Cache] Review for ${fileName}`);
      return this.extractStructuredResponse(this.responseCache.get(cacheKey)!);
    }

    const prompt = `Security review: ${lang} file ${fileName}

Code:
\`\`\`
${code.slice(0, 2500)}
\`\`\`

JSON findings:`;

    try {
      let fullResponse = '';
      const generatePromise = this.client.generate({
        model: this.model,
        prompt,
        stream: true,
        options: { temperature: 0.3, num_predict: 400, num_thread: 4 }
      });

      const stream = await this.withTimeout(generatePromise, 30000);

      for await (const chunk of stream) {
        fullResponse += chunk.response;
        if (onChunk) onChunk(chunk.response);
      }

      this.responseCache.set(cacheKey, fullResponse);
      if (this.responseCache.size > 50) {
        const key = this.responseCache.keys().next().value;
        this.responseCache.delete(key);
      }

      return this.extractStructuredResponse(fullResponse);
    } catch (error) {
      console.error(`Review failed:`, error);
      return { findings: [], measures: [] };
    }
  }

  async quickReview(code: string, fileName: string): Promise<string> {
    const ready = await this.isModelReady();
    if (!ready) return "Ollama not running";

    const cacheKey = this.getCacheKey(code.slice(0, 1000), 'quick-review');
    if (this.responseCache.has(cacheKey)) {
      console.log(`[Cache Hit] Quick review for ${fileName}`);
      return this.responseCache.get(cacheKey)!;
    }

    const shortCode = code.substring(0, 1500);
    const prompt = `Quick security scan of ${fileName}. List top 3 issues only:\n\n\`\`\`\n${shortCode}\n\`\`\`\n\nIssues:`;

    try {
      let fullResponse = '';
      const generatePromise = this.client.generate({
        model: this.model,
        prompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 200, num_thread: 4 }
      });

      const response = await this.withTimeout(generatePromise, 15000);
      fullResponse = response.response;

      this.responseCache.set(cacheKey, fullResponse);
      if (this.responseCache.size > 50) {
        const key = this.responseCache.keys().next().value;
        this.responseCache.delete(key);
      }

      return fullResponse;
    } catch (error) {
      console.error(`Quick review failed:`, error);
      return 'Timeout. Make sure Ollama is running.';
    }
  }

  async chatWithArchitect(messages: { role: string; content: string }[], onChunk?: (chunk: string) => void): Promise<string> {
    const ready = await this.isModelReady();
    if (!ready) return "Ollama not running. Start with: docker run -d -p 11434:11434 ollama/ollama:latest";

    const cacheKey = this.getCacheKey(JSON.stringify(messages.slice(-3)), 'chat');
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey)!;
      if (onChunk) onChunk(cached);
      return cached;
    }

    const systemMsg = {
      role: 'system',
      content: 'Security expert. Short answers. Use code blocks for code.'
    };

    try {
      const recentMessages = messages.slice(-8);
      const allMessages = [systemMsg, ...recentMessages];
      let fullText = '';

      const chatPromise = this.client.chat({
        model: this.model,
        messages: allMessages,
        stream: true,
        options: { temperature: 0.3, num_predict: 300, num_thread: 4 }
      });

      const stream = await this.withTimeout(chatPromise, 20000);

      for await (const chunk of stream) {
        const content = chunk.message.content;
        fullText += content;
        if (onChunk) onChunk(content);
      }

      this.responseCache.set(cacheKey, fullText);
      if (this.responseCache.size > 50) {
        const key = this.responseCache.keys().next().value;
        this.responseCache.delete(key);
      }

      return fullText;
    } catch (error) {
      console.error(`Chat error:`, error);
      return 'Timeout. Try: (1) shorter question (2) restart Ollama (3) check Docker running';
    }
  }
}
