import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileCode,
  Lightbulb,
  ShieldCheck,
  BrainCircuit,
  Terminal,
  ChevronRight,
  ShieldAlert,
  Zap,
  CheckCircle,
  Send,
  User,
  Bot,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useProjectStore, ScanFinding } from "../store/projectStore";
import { Progress } from "../components/ui/progress";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  findings?: ScanFinding[];
  measures?: string[];
  isContext?: boolean;
}

export function AIReview() {
  const { getActiveProject, saveAIReview } = useProjectStore();
  const activeProject = getActiveProject();
  
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [isContextSynced, setIsContextSynced] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeProject?.path) {
      loadProjectFiles();
    }
  }, [activeProject?.id]);

  useEffect(() => {
    if (activeProject?.aiReviews) {
      const history: Record<string, Message[]> = {};
      Object.entries(activeProject.aiReviews).forEach(([file, review]) => {
        if (review.messages) {
          history[file] = review.messages;
        }
      });
      setChatHistory(history);
      setIsContextSynced(true);
    }
  }, [activeProject?.aiReviews]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, selectedFile]);

  useEffect(() => {
    const handleChatChunk = (chunk: string) => {
      setChatHistory(prev => {
        if (!selectedFile) return prev;
        const currentArr = prev[selectedFile] || [];
        const current = [...currentArr];
        const last = current[current.length - 1];
        if (last && last.role === 'assistant') {
          last.content += chunk;
          return { ...prev, [selectedFile]: current };
        }
        return prev;
      });
    };

    const handleReviewChunk = (chunk: string) => {
      setChatHistory(prev => {
        if (!selectedFile) return prev;
        const currentArr = prev[selectedFile] || [];
        const current = [...currentArr];
        const last = current[current.length - 1];
        if (last && last.role === 'assistant') {
          if (chunk.includes('[[JSON]]')) return prev;
          last.content += chunk.replace('[[REASONING]]', '');
          return { ...prev, [selectedFile]: current };
        }
        return prev;
      });
    };

    (window as any).api?.onAIChatChunk?.(handleChatChunk);
    (window as any).api?.onAIReviewChunk?.(handleReviewChunk);
  }, [selectedFile]);

  const loadProjectFiles = async () => {
    try {
      if (!activeProject?.path) return;
      const allFiles = await (window as any).api.getFiles(activeProject.path);
      const codeFiles = allFiles.filter((f: string) => 
        ['.cs', '.ts', '.js', '.py', '.go', '.java', '.php', '.cpp', '.c'].some(ext => f.endsWith(ext))
      );
      setFiles(codeFiles);
      if (codeFiles.length > 0 && !selectedFile) {
        setSelectedFile(codeFiles[0]);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    }
  };

  const currentMessages = selectedFile ? (chatHistory[selectedFile] || []).filter(m => !m.isContext) : [];
  const currentFileName = selectedFile ? selectedFile.split(/[\\/]/).pop() : "";

  const handleQuickAudit = async () => {
    if (!selectedFile || !activeProject || isGenerating) return;
    
    setIsGenerating(true);
    const newUserMsg: Message = { role: 'user', content: `Quick review: ${currentFileName}` };
    const placeholderMsg: Message = { role: 'assistant', content: "" };
    
    setChatHistory(prev => ({
      ...prev,
      [selectedFile]: [...(prev[selectedFile] || []), newUserMsg, placeholderMsg]
    }));

    try {
      const content = await (window as any).api.readFile(selectedFile);
      // Quick mode: only first 2000 chars
      const truncated = content.substring(0, 2000);
      const quickPrompt = `Quickly review this code snippet for critical issues only:\n\n${truncated}\n\nList 3-5 main issues if any, be concise.`;
      
      const response = await (window as any).api.chatWithArchitect([
        { role: 'user', content: quickPrompt }
      ]);
      
      setChatHistory(prev => {
        const current = [...(prev[selectedFile] || [])];
        const last = current[current.length - 1];
        if (last) last.content = response;
        return { ...prev, [selectedFile]: current };
      });

      await (window as any).api.saveChatMessage(activeProject.id, selectedFile, newUserMsg.content, 'user');
      await (window as any).api.saveChatMessage(activeProject.id, selectedFile, response, 'assistant');
      setIsGenerating(false);
    } catch (err) {
      console.error("Quick audit failed:", err);
      setIsGenerating(false);
    }
  };

  const handleAudit = async () => {
    if (!selectedFile || !activeProject || isGenerating) return;
    
    setIsGenerating(true);
    const newUserMsg: Message = { role: 'user', content: `Audit of ${currentFileName}` };
    const placeholderMsg: Message = { role: 'assistant', content: "" };
    
    setChatHistory(prev => ({
      ...prev,
      [selectedFile]: [...(prev[selectedFile] || []), newUserMsg, placeholderMsg]
    }));

    try {
      const content = await (window as any).api.readFile(selectedFile);
      // Limit to 5000 chars for faster processing
      const limited = content.substring(0, 5000);
      const auditPrompt = `Perform security and performance audit:\n\n${limited}\n\nProvide: 1) Security issues 2) Performance concerns 3) Best practices violated 4) Recommended fixes`;
      
      const response = await (window as any).api.chatWithArchitect([
        { role: 'user', content: auditPrompt }
      ]);
      
      const aiFindings: any[] = [];  // Placeholder
      const totalFindings = aiFindings;
      
      setChatHistory(prev => {
        const current = [...(prev[selectedFile] || [])];
        const last = current[current.length - 1];
        if (last) {
          last.content = response;
          last.findings = totalFindings;
        }
        return { ...prev, [selectedFile]: current };
      });

      await (window as any).api.saveChatMessage(activeProject.id, selectedFile, newUserMsg.content, 'user');
      await (window as any).api.saveChatMessage(activeProject.id, selectedFile, response, 'assistant');
      setIsGenerating(false);
    } catch (err) {
      console.error("Audit failed:", err);
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !selectedFile || !activeProject || isGenerating) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    setIsGenerating(true);

    try {
      const content = await (window as any).api.readFile(selectedFile);
      
      // Include file context in the message
      const contextText = `Here's the code from ${selectedFile.split(/[\\/]/).pop()}:\n\n\`\`\`\n${content}\n\`\`\`\n\nUser question: ${userText}`;
      
      const userMsg: Message = { role: 'user', content: userText };
      const placeholderMsg: Message = { role: 'assistant', content: "" };
      
      const currentHistory = chatHistory[selectedFile] || [];
      const updatedHistory = [...currentHistory, userMsg, placeholderMsg];

      setChatHistory(prev => ({
        ...prev,
        [selectedFile]: updatedHistory
      }));

      const ollamaMessages = [
        { role: 'user', content: contextText },
        ...updatedHistory
          .filter(m => !m.isContext && m.role === 'assistant')
          .map(m => ({ role: 'assistant', content: m.content }))
      ];
      
      const finalText = await (window as any).api.chatWithArchitect(ollamaMessages);
      
      setChatHistory(prev => {
        const current = [...(prev[selectedFile] || [])];
        const last = current[current.length - 1];
        if (last) last.content = finalText;
        return { ...prev, [selectedFile]: current };
      });

      await (window as any).api.saveChatMessage(activeProject.id, selectedFile, userText, 'user');
      await (window as any).api.saveChatMessage(activeProject.id, selectedFile, finalText, 'assistant');

      setIsGenerating(false);
      setIsContextSynced(true);
    } catch (err) {
      console.error("Chat failed:", err);
      setIsGenerating(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="p-4 bg-slate-50 rounded-full border border-slate-200 text-slate-300">
          <BrainCircuit className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No AI Context</h2>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 bg-purple-50 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">AI Architect Chat</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Llama 2 Fast Mode
              </p>
              {isContextSynced && (
                <Badge variant="outline" className="text-[9px] px-2 bg-green-50 text-green-600 border-green-100 font-black uppercase">
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleQuickAudit}
            disabled={isGenerating || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-3 gap-2 text-xs transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            QUICK
          </Button>
          <Button
            onClick={handleAudit}
            disabled={isGenerating || !selectedFile}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 px-4 gap-2 text-xs transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            DEEP AUDIT
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden gap-0">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 overflow-y-auto flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3">
              Files
            </h3>
            <div className="space-y-1">
              {files.map((file, idx) => {
                const fname = file.split(/[\\/]/).pop();
                const isSelected = selectedFile === file;
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium truncate ${
                      isSelected 
                        ? "bg-white text-purple-600 border border-purple-200 shadow-sm" 
                        : "text-slate-600 hover:bg-slate-100 border border-transparent"
                    }`}
                    title={fname}
                  >
                    {fname}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container - FIXED OVERFLOW */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-white"
            style={{ scrollBehavior: 'smooth' }}
          >
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <FileCode className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm">Select a file and ask questions about it</p>
              </div>
            ) : (
              currentMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                  )}

                  {/* Message Bubble - FIXED OVERFLOW */}
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg word-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          components={{
                            code: ({ inline, children }) => (
                              inline ? (
                                <code className="bg-slate-200 px-2 py-0.5 rounded text-xs font-mono break-words">
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-slate-800 text-slate-50 p-3 rounded-lg overflow-x-auto my-2">
                                  <code className="font-mono text-xs">{children}</code>
                                </pre>
                              )
                            ),
                            p: ({ children }) => <p className="my-1 break-words">{children}</p>,
                            li: ({ children }) => <li className="my-1 break-words">{children}</li>,
                            ul: ({ children }) => <ul className="list-disc list-inside my-1">{children}</ul>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-300 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isGenerating && (
              <div className="flex gap-3 animate-in fade-in">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="bg-slate-100 rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-4 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about this file..."
                disabled={isGenerating}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={isGenerating || !inputMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
