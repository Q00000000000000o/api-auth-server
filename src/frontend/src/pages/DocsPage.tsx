import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Copy,
  Loader2,
  Lock,
  Menu,
  Send,
  Shield,
  Terminal,
  Unlock,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

interface Props {
  onAdminClick: () => void;
}

type EndpointId = "login" | "profile" | "logout";

interface TryItState {
  isLoading: boolean;
  response: string | null;
  error: string | null;
  statusCode: number | null;
}

const initTry = (): TryItState => ({
  isLoading: false,
  response: null,
  error: null,
  statusCode: null,
});

const generateToken = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let t = "sk-apiserver-";
  for (let i = 0; i < 36; i++)
    t += chars[Math.floor(Math.random() * chars.length)];
  return t;
};

const fmtJson = (obj: unknown): string => JSON.stringify(obj, null, 2);

const PASSPHRASE = "aaaaaaaa";

function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" }) {
  const cls =
    method === "GET"
      ? "badge-get"
      : method === "POST"
        ? "badge-post"
        : "badge-delete";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${cls}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group">
      <pre className="terminal-bg border border-border rounded-md p-4 text-xs font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded bg-muted/60 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="w-3 h-3 text-primary" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

interface ParamRow {
  name: string;
  type: string;
  required: boolean;
  location: string;
  description: string;
}

function ParamsTable({ params }: { params: ParamRow[] }) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            {["参数", "类型", "位置", "必填", "说明"].map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2 font-medium text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-mono text-primary">{p.name}</td>
              <td className="px-3 py-2 font-mono text-accent">{p.type}</td>
              <td className="px-3 py-2 text-muted-foreground">{p.location}</td>
              <td className="px-3 py-2">
                {p.required ? (
                  <span className="text-destructive font-medium">是</span>
                ) : (
                  <span className="text-muted-foreground">否</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {p.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResponsePanel({ state }: { state: TryItState }) {
  if (!state.response && !state.error && state.statusCode === null) return null;
  return (
    <div data-ocid="docs.response_panel">
      {state.statusCode !== null && (
        <div
          className={`flex items-center gap-2 text-xs mb-2 ${state.statusCode === 200 ? "text-primary" : "text-destructive"}`}
        >
          <span className="font-mono font-bold">{state.statusCode}</span>
          <span>{state.statusCode === 200 ? "OK" : "Error"}</span>
        </div>
      )}
      {state.response && <CodeBlock code={state.response} />}
      {state.error && (
        <div
          data-ocid="docs.error_state"
          className="bg-destructive/10 border border-destructive/30 rounded p-3 text-xs text-destructive-foreground"
        >
          {state.error}
        </div>
      )}
    </div>
  );
}

export default function DocsPage({ onAdminClick }: Props) {
  const { actor } = useActor();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>("login");
  const [mockToken, setMockToken] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openTryIt, setOpenTryIt] = useState<EndpointId | null>(null);

  const [loginTry, setLoginTry] = useState<TryItState>(initTry());
  const [profileTry, setProfileTry] = useState<TryItState>(initTry());
  const [logoutTry, setLogoutTry] = useState<TryItState>(initTry());

  const [passphraseInput, setPassphraseInput] = useState("");
  const [profileTokenInput, setProfileTokenInput] = useState("");
  const [logoutTokenInput, setLogoutTokenInput] = useState("");

  const loginRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const logoutRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: EndpointId) => {
    setActiveEndpoint(id);
    setMobileSidebarOpen(false);
    const refs: Record<EndpointId, React.RefObject<HTMLDivElement | null>> = {
      login: loginRef,
      profile: profileRef,
      logout: logoutRef,
    };
    refs[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLoginTrigger = async () => {
    setLoginTry({
      isLoading: true,
      response: null,
      error: null,
      statusCode: null,
    });
    await new Promise((r) => setTimeout(r, 400));
    if (passphraseInput === PASSPHRASE) {
      const token = generateToken();
      setMockToken(token);
      setIsAuthenticated(true);
      setProfileTokenInput(`Bearer ${token}`);
      setLogoutTokenInput(`Bearer ${token}`);
      setLoginTry({
        isLoading: false,
        response: fmtJson({
          token: `Bearer ${token}`,
          token_type: "bearer",
          expires_in: 2592000,
        }),
        error: null,
        statusCode: 200,
      });
    } else {
      setLoginTry({
        isLoading: false,
        response: null,
        error: "401 Unauthorized: 口令错误",
        statusCode: 401,
      });
    }
  };

  const handleTryProfile = async () => {
    const token = profileTokenInput.trim();
    if (!token) {
      setProfileTry({
        isLoading: false,
        response: null,
        error: "请先获取 Bearer Token（调用 POST /api/login）",
        statusCode: 401,
      });
      return;
    }
    if (!isAuthenticated || !actor) {
      setProfileTry({
        isLoading: false,
        response: null,
        error: "未认证。请先调用 POST /api/login 获取 Token。",
        statusCode: 401,
      });
      return;
    }
    setProfileTry({
      isLoading: true,
      response: null,
      error: null,
      statusCode: null,
    });
    try {
      const resume = await actor.getOwnFullResume();
      setProfileTry({
        isLoading: false,
        response: fmtJson(resume),
        error: null,
        statusCode: 200,
      });
    } catch (e) {
      setProfileTry({
        isLoading: false,
        response: null,
        error: (e as Error).message || "请求失败",
        statusCode: 500,
      });
    }
  };

  const handleTryLogout = async () => {
    setLogoutTry({
      isLoading: true,
      response: null,
      error: null,
      statusCode: null,
    });
    await new Promise((r) => setTimeout(r, 400));
    setIsAuthenticated(false);
    setMockToken(null);
    setProfileTokenInput("");
    setLogoutTokenInput("");
    setPassphraseInput("");
    setLoginTry(initTry());
    setLogoutTry({
      isLoading: false,
      response: fmtJson({
        message: "Successfully logged out",
        timestamp: new Date().toISOString(),
      }),
      error: null,
      statusCode: 200,
    });
  };

  const endpoints = [
    {
      id: "login" as EndpointId,
      method: "POST" as const,
      path: "/api/login",
      summary: "用户登录",
    },
    {
      id: "profile" as EndpointId,
      method: "GET" as const,
      path: "/api/profile",
      summary: "获取简历",
    },
    {
      id: "logout" as EndpointId,
      method: "POST" as const,
      path: "/api/logout",
      summary: "注销登录",
    },
  ];

  const SidebarContent = () => (
    <nav className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-sidebar-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          认证接口
        </p>
      </div>
      <div className="flex-1 py-2">
        {endpoints.map((ep) => (
          <button
            type="button"
            key={ep.id}
            data-ocid={`docs.${ep.id}_tab`}
            onClick={() => scrollTo(ep.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sidebar-accent ${
              activeEndpoint === ep.id
                ? "bg-sidebar-accent border-r-2 border-primary"
                : ""
            }`}
          >
            <MethodBadge method={ep.method} />
            <span className="font-mono text-xs text-foreground truncate">
              {ep.path}
            </span>
          </button>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-sidebar-border">
        {isAuthenticated ? (
          <div className="flex items-center gap-2 text-xs">
            <Unlock className="w-3 h-3 text-primary" />
            <span className="text-primary">已认证</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">未认证</span>
          </div>
        )}
        {mockToken && (
          <div className="mt-2 bg-primary/10 border border-primary/20 rounded px-2 py-1.5">
            <p className="text-xs text-muted-foreground mb-0.5">当前 Token</p>
            <p className="font-mono text-xs text-primary truncate">
              {mockToken.slice(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </nav>
  );

  const TryItToggle = ({ id }: { id: EndpointId }) => (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        在线调试
      </h3>
      <Button
        data-ocid="docs.try_it_button"
        size="sm"
        variant="outline"
        className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
        onClick={() => setOpenTryIt(openTryIt === id ? null : id)}
      >
        <Terminal className="w-3 h-3" />
        {openTryIt === id ? "关闭" : "Try it"}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-sidebar/95 backdrop-blur-sm">
        <div className="flex items-center px-6 py-3 gap-4">
          <button
            type="button"
            className="lg:hidden p-1.5 rounded hover:bg-muted transition-colors"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-mono font-semibold text-sm">AuthServer</span>
            <span className="font-mono text-xs text-muted-foreground hidden sm:block">
              API Reference
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-muted/40 border border-border rounded px-3 py-1 font-mono text-xs text-muted-foreground">
            <span>Base URL:</span>
            <span className="text-primary ml-1">
              https://api.authserver.app
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-primary hidden sm:block">已认证</span>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-border"
              onClick={onAdminClick}
              data-ocid="docs.admin_button"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">管理面板</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 left-0 bottom-0 w-64 z-40 bg-sidebar border-r border-sidebar-border lg:hidden"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 pt-14">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 fixed top-14 bottom-0 left-0 bg-sidebar border-r border-sidebar-border overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-60 xl:ml-64 min-w-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-16">
            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">
                  v1.0.0
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-border text-muted-foreground"
                >
                  REST API
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                AuthServer API
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                基于 Internet Computer 区块链的用户认证与简历管理 API。通过
                Bearer Token 鉴权，兼容 OpenAI 风格的接口访问方式。
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "认证方式", value: "口令验证" },
                  { label: "协议", value: "HTTPS / ICP" },
                  { label: "Token 有效期", value: "30 天" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-card border border-border rounded-md px-4 py-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-mono font-medium mt-0.5 text-primary">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Auth Note */}
            <section>
              <div className="bg-muted/30 border border-border rounded-lg p-5">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-accent" />
                  鉴权说明
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  所有需要鉴权的接口均需在 HTTP 请求头中附带 Bearer Token：
                </p>
                <CodeBlock
                  code={
                    "Authorization: Bearer sk-apiserver-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  }
                />
              </div>
            </section>

            {/* ═══ Endpoint: POST /api/login ═══ */}
            <motion.section
              ref={loginRef}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              id="login"
            >
              <div className="flex items-center gap-3 mb-4">
                <MethodBadge method="POST" />
                <code className="font-mono text-base font-semibold">
                  /api/login
                </code>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                使用口令进行身份验证。成功后返回 Bearer Token，用于后续 API
                调用。
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      请求参数
                    </h3>
                    <ParamsTable
                      params={[
                        {
                          name: "passphrase",
                          type: "string",
                          required: true,
                          location: "body",
                          description: "访问口令",
                        },
                      ]}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      请求示例
                    </h3>
                    <CodeBlock
                      code={`curl -X POST https://api.authserver.app/api/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"passphrase":"aaaaaaaa"}'`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      返回示例
                    </h3>
                    <CodeBlock
                      code={fmtJson({
                        token: "Bearer sk-apiserver-a1b2c3...",
                        token_type: "bearer",
                        expires_in: 2592000,
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <TryItToggle id="login" />
                  <AnimatePresence>
                    {openTryIt === "login" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div className="bg-card p-4 space-y-3">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="login-passphrase-input"
                              className="text-xs text-muted-foreground"
                            >
                              口令 (Passphrase)
                            </label>
                            <Input
                              id="login-passphrase-input"
                              data-ocid="docs.login_input"
                              type="password"
                              value={passphraseInput}
                              onChange={(e) =>
                                setPassphraseInput(e.target.value)
                              }
                              placeholder="请输入口令"
                              className="font-mono text-xs bg-input border-border"
                            />
                          </div>
                          <div className="font-mono text-xs terminal-bg border border-border rounded p-3">
                            <p className="text-muted-foreground">
                              POST /api/login HTTP/1.1
                            </p>
                            <p className="text-muted-foreground">
                              Host: api.authserver.app
                            </p>
                            <p className="text-primary">
                              {'{"passphrase":"'}
                              {passphraseInput ? "••••••••" : "<passphrase>"}
                              {'"}'}
                            </p>
                          </div>
                          <Button
                            data-ocid="docs.send_button"
                            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleLoginTrigger}
                            disabled={loginTry.isLoading || isAuthenticated}
                          >
                            {loginTry.isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                验证中...
                              </>
                            ) : isAuthenticated ? (
                              <>
                                <Check className="w-4 h-4" />
                                已登录
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                发送请求
                              </>
                            )}
                          </Button>
                          <ResponsePanel state={loginTry} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>

            <Separator className="bg-border" />

            {/* ═══ Endpoint: GET /api/profile ═══ */}
            <motion.section
              ref={profileRef}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              id="profile"
            >
              <div className="flex items-center gap-3 mb-4">
                <MethodBadge method="GET" />
                <code className="font-mono text-base font-semibold">
                  /api/profile
                </code>
                <Badge
                  variant="outline"
                  className="text-xs border-accent/40 text-accent"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  需要鉴权
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                获取当前用户的完整简历信息，包含基本信息、工作经历和教育背景。需要有效的
                Bearer Token。
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      请求头
                    </h3>
                    <ParamsTable
                      params={[
                        {
                          name: "Authorization",
                          type: "string",
                          required: true,
                          location: "header",
                          description:
                            "Bearer Token，格式：Bearer sk-apiserver-...",
                        },
                      ]}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      请求示例
                    </h3>
                    <CodeBlock
                      code={`curl -X GET https://api.authserver.app/api/profile \\\n  -H "Authorization: Bearer sk-apiserver-xxxxxxxx..."`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      返回示例
                    </h3>
                    <CodeBlock
                      code={fmtJson({
                        name: "张伟",
                        email: "zhang.wei@example.com",
                        position: "高级后端工程师",
                        company: "字节跳动",
                        workExperiences: [
                          {
                            company: "字节跳动",
                            title: "高级后端工程师",
                            startDate: "2022-03-01",
                            description: "负责推荐系统核心服务",
                          },
                        ],
                        educations: [
                          {
                            school: "清华大学",
                            degree: "本科",
                            major: "计算机科学",
                            startDate: "2015-09-01",
                            endDate: "2019-06-30",
                          },
                        ],
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <TryItToggle id="profile" />
                  <AnimatePresence>
                    {openTryIt === "profile" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div className="bg-card p-4 space-y-3">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="profile-token-input"
                              className="text-xs text-muted-foreground"
                            >
                              Authorization Header
                            </label>
                            <Input
                              id="profile-token-input"
                              data-ocid="docs.token_input"
                              value={profileTokenInput}
                              onChange={(e) =>
                                setProfileTokenInput(e.target.value)
                              }
                              placeholder="Bearer sk-apiserver-..."
                              className="font-mono text-xs bg-input border-border"
                            />
                          </div>
                          <div className="font-mono text-xs terminal-bg border border-border rounded p-3">
                            <p className="text-muted-foreground">
                              GET /api/profile HTTP/1.1
                            </p>
                            <p className="text-muted-foreground">
                              Host: api.authserver.app
                            </p>
                            <p className="text-primary truncate">
                              Authorization: {profileTokenInput || "<token>"}
                            </p>
                          </div>
                          <Button
                            data-ocid="docs.send_button"
                            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleTryProfile}
                            disabled={profileTry.isLoading}
                          >
                            {profileTry.isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                请求中...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                发送请求
                              </>
                            )}
                          </Button>
                          <ResponsePanel state={profileTry} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>

            <Separator className="bg-border" />

            {/* ═══ Endpoint: POST /api/logout ═══ */}
            <motion.section
              ref={logoutRef}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              id="logout"
            >
              <div className="flex items-center gap-3 mb-4">
                <MethodBadge method="POST" />
                <code className="font-mono text-base font-semibold">
                  /api/logout
                </code>
                <Badge
                  variant="outline"
                  className="text-xs border-accent/40 text-accent"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  需要鉴权
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                注销当前会话，使 Bearer Token 失效。退出后需重新登录以获取新
                Token。
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      请求头
                    </h3>
                    <ParamsTable
                      params={[
                        {
                          name: "Authorization",
                          type: "string",
                          required: true,
                          location: "header",
                          description: "需要作废的 Bearer Token",
                        },
                      ]}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      请求示例
                    </h3>
                    <CodeBlock
                      code={`curl -X POST https://api.authserver.app/api/logout \\\n  -H "Authorization: Bearer sk-apiserver-xxxxxxxx..."`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      返回示例
                    </h3>
                    <CodeBlock
                      code={fmtJson({
                        message: "Successfully logged out",
                        timestamp: "2026-03-11T12:00:00.000Z",
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <TryItToggle id="logout" />
                  <AnimatePresence>
                    {openTryIt === "logout" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div className="bg-card p-4 space-y-3">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="logout-token-input"
                              className="text-xs text-muted-foreground"
                            >
                              Authorization Header
                            </label>
                            <Input
                              id="logout-token-input"
                              data-ocid="docs.token_input"
                              value={logoutTokenInput}
                              onChange={(e) =>
                                setLogoutTokenInput(e.target.value)
                              }
                              placeholder="Bearer sk-apiserver-..."
                              className="font-mono text-xs bg-input border-border"
                            />
                          </div>
                          <div className="font-mono text-xs terminal-bg border border-border rounded p-3">
                            <p className="text-muted-foreground">
                              POST /api/logout HTTP/1.1
                            </p>
                            <p className="text-muted-foreground">
                              Host: api.authserver.app
                            </p>
                            <p className="text-primary truncate">
                              Authorization: {logoutTokenInput || "<token>"}
                            </p>
                          </div>
                          <Button
                            data-ocid="docs.send_button"
                            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleTryLogout}
                            disabled={logoutTry.isLoading}
                          >
                            {logoutTry.isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                处理中...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                发送请求
                              </>
                            )}
                          </Button>
                          <ResponsePanel state={logoutTry} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>

            {/* Error Codes */}
            <section>
              <h2 className="text-lg font-semibold mb-4">错误码说明</h2>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      {["状态码", "含义", "说明"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 font-medium text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: "200", meaning: "OK", desc: "请求成功" },
                      {
                        code: "401",
                        meaning: "Unauthorized",
                        desc: "口令错误或 Token 无效",
                      },
                      {
                        code: "403",
                        meaning: "Forbidden",
                        desc: "权限不足，需要更高角色",
                      },
                      { code: "404", meaning: "Not Found", desc: "用户不存在" },
                      {
                        code: "500",
                        meaning: "Internal Error",
                        desc: "服务器内部错误",
                      },
                    ].map((row) => (
                      <tr
                        key={row.code}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-2.5 font-mono font-semibold text-primary">
                          {row.code}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {row.meaning}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {row.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <footer className="border-t border-border px-6 py-6 mt-8">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span>AuthServer API — 基于 Internet Computer</span>
              </div>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()}. Built with ❤️ using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
