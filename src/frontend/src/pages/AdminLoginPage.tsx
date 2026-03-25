import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Key, Loader2, Shield, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

const PASSPHRASE = "aaaaaaaa";

export default function AdminLoginPage({ onSuccess, onBack }: Props) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);
    if (passphrase === PASSPHRASE) {
      onSuccess();
    } else {
      setError("口令错误，请重试");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          data-ocid="login.link"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文档
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono text-muted-foreground">
            AuthServer API
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  管理员登录
                </h1>
                <p className="text-sm text-muted-foreground">输入管理员口令</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>管理员口令</span>
                </div>
                <Input
                  data-ocid="login.input"
                  type="password"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    setError("");
                  }}
                  placeholder="请输入口令"
                  className="font-mono bg-input border-border"
                  autoFocus
                />
                {error && (
                  <p
                    data-ocid="login.error_state"
                    className="text-xs text-destructive mt-1"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                {[
                  "口令验证，无需账号注册",
                  "登录后可访问管理面板",
                  "Token 有效期 30 天",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <Button
                data-ocid="login.submit_button"
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中...
                  </>
                ) : (
                  "登录"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                仅限授权管理员访问
              </p>
            </form>
          </div>

          <div className="mt-6 bg-sidebar border border-border rounded-md p-4 font-mono text-xs">
            <p className="text-muted-foreground mb-2"># 等价 API 调用</p>
            <p className="text-primary">POST /api/login</p>
            <p className="text-muted-foreground">
              {'{ "passphrase": "aaaaaaaa" }'}
            </p>
            <p className="text-accent mt-1">
              {'→ { "token": "Bearer sk-..." }'}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
