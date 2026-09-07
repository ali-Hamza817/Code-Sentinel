import { Lock, Server, Brain, Sliders, CheckCircle } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { PageContainer, PageHeader, Panel } from "../components/common";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium text-slate-900">{label}</Label>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

function EnabledBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-md border-emerald-200 bg-emerald-50 text-emerald-700"
    >
      <CheckCircle className="h-3 w-3" />
      Enabled
    </Badge>
  );
}

export function Settings() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        eyebrow="Settings"
        title="Preferences"
        description="Configure how CodeSentinel analyses and sandboxes your code"
      />

      <Panel title="Privacy & security" icon={Lock} bodyClassName="space-y-6">
        <SettingRow
          label="Offline mode"
          description="Process all data locally without an internet connection"
        >
          <EnabledBadge />
          <Switch defaultChecked disabled />
        </SettingRow>
        <SettingRow
          label="No cloud data transmission"
          description="Never send code or analysis data to external servers"
        >
          <EnabledBadge />
          <Switch defaultChecked disabled />
        </SettingRow>
        <SettingRow
          label="Encrypted local storage"
          description="Encrypt analysis results and cached data"
        >
          <Switch defaultChecked />
        </SettingRow>
      </Panel>

      <Panel
        title="Docker configuration"
        icon={Server}
        bodyClassName="space-y-6"
      >
        <div className="space-y-2">
          <Label
            htmlFor="docker-image"
            className="text-sm font-medium text-slate-900"
          >
            Sandbox image
          </Label>
          <Select defaultValue="node18">
            <SelectTrigger id="docker-image">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="node18">Node.js 18 (Alpine)</SelectItem>
              <SelectItem value="node20">Node.js 20 (Alpine)</SelectItem>
              <SelectItem value="python311">Python 3.11</SelectItem>
              <SelectItem value="java17">Java 17 (OpenJDK)</SelectItem>
              <SelectItem value="dotnet7">.NET 7</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="memory-limit"
            className="text-sm font-medium text-slate-900"
          >
            Memory limit (MB)
          </Label>
          <Input
            id="memory-limit"
            type="number"
            defaultValue="512"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="timeout"
            className="text-sm font-medium text-slate-900"
          >
            Execution timeout (seconds)
          </Label>
          <Input
            id="timeout"
            type="number"
            defaultValue="30"
            className="max-w-xs"
          />
        </div>
      </Panel>

      <Panel
        title="AI model configuration"
        icon={Brain}
        bodyClassName="space-y-6"
      >
        <div className="space-y-2">
          <Label
            htmlFor="llm-model"
            className="text-sm font-medium text-slate-900"
          >
            Local LLM model (Ollama)
          </Label>
          <Select defaultValue="codellama">
            <SelectTrigger id="llm-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="codellama">CodeLlama 13B</SelectItem>
              <SelectItem value="llama2">Llama 2 13B</SelectItem>
              <SelectItem value="mistral">Mistral 7B</SelectItem>
              <SelectItem value="phi2">Phi-2</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            The selected model runs entirely on your machine
          </p>
        </div>
        <SettingRow
          label="Enable AI review"
          description="Use the local model for code analysis and suggestions"
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          label="Auto-generate summaries"
          description="Automatically create AI summaries after scans"
        >
          <Switch defaultChecked />
        </SettingRow>
      </Panel>

      <Panel
        title="Analysis configuration"
        icon={Sliders}
        bodyClassName="space-y-6"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-900">
              Scan depth
            </Label>
            <span className="text-sm text-slate-600">Deep</span>
          </div>
          <Slider defaultValue={[75]} max={100} step={25} />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Quick</span>
            <span>Standard</span>
            <span>Deep</span>
            <span>Comprehensive</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="complexity-threshold"
            className="text-sm font-medium text-slate-900"
          >
            Complexity threshold
          </Label>
          <Input
            id="complexity-threshold"
            type="number"
            defaultValue="15"
            className="max-w-xs"
          />
          <p className="text-xs text-slate-500">
            Functions exceeding this complexity will be flagged
          </p>
        </div>
        <SettingRow
          label="Include test files"
          description="Analyse test files in complexity calculations"
        >
          <Switch />
        </SettingRow>
        <SettingRow
          label="Ignore node_modules"
          description="Exclude dependencies from analysis"
        >
          <Switch defaultChecked />
        </SettingRow>
      </Panel>
    </PageContainer>
  );
}
