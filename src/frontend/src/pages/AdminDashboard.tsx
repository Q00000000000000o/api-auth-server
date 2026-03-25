import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import {
  Briefcase,
  Building2,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  Plus,
  Shield,
  Terminal,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  EducationDetails,
  UserRole,
  WorkExperienceDetails,
} from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddEducation,
  useAddWorkExperience,
  useAssignRole,
  useOwnResume,
} from "../hooks/useQueries";
import { dateToTime, formatDate } from "../utils/time";

interface WorkExpForm {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}
interface EduForm {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
}

const defaultWorkExp: WorkExpForm = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  description: "",
};
const defaultEdu: EduForm = {
  school: "",
  degree: "",
  major: "",
  startDate: "",
  endDate: "",
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { identity, clear } = useInternetIdentity();
  const { data: resume, isLoading } = useOwnResume();
  const addWorkExp = useAddWorkExperience();
  const addEdu = useAddEducation();
  const assignRole = useAssignRole();

  const [workExpDialog, setWorkExpDialog] = useState(false);
  const [eduDialog, setEduDialog] = useState(false);
  const [workExpForm, setWorkExpForm] = useState<WorkExpForm>(defaultWorkExp);
  const [eduForm, setEduForm] = useState<EduForm>(defaultEdu);
  const [rolePrincipal, setRolePrincipal] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");

  const ownPrincipal = identity?.getPrincipal();
  const handleLogout = () => {
    clear();
    onLogout();
  };

  const handleAddWorkExp = async () => {
    if (!ownPrincipal) return;
    if (!workExpForm.company || !workExpForm.title || !workExpForm.startDate) {
      toast.error("请填写必要字段");
      return;
    }
    const data: WorkExperienceDetails = {
      company: workExpForm.company,
      title: workExpForm.title,
      startDate: dateToTime(workExpForm.startDate),
      description: workExpForm.description,
      ...(workExpForm.endDate
        ? { endDate: dateToTime(workExpForm.endDate) }
        : {}),
    };
    try {
      await addWorkExp.mutateAsync({
        userId: ownPrincipal,
        workExperience: data,
      });
      toast.success("工作经历已添加");
      setWorkExpDialog(false);
      setWorkExpForm(defaultWorkExp);
    } catch {
      toast.error("添加失败，请重试");
    }
  };

  const handleAddEdu = async () => {
    if (!ownPrincipal) return;
    if (!eduForm.school || !eduForm.degree || !eduForm.startDate) {
      toast.error("请填写必要字段");
      return;
    }
    const data: EducationDetails = {
      school: eduForm.school,
      degree: eduForm.degree,
      major: eduForm.major,
      startDate: dateToTime(eduForm.startDate),
      ...(eduForm.endDate ? { endDate: dateToTime(eduForm.endDate) } : {}),
    };
    try {
      await addEdu.mutateAsync({ userId: ownPrincipal, education: data });
      toast.success("教育背景已添加");
      setEduDialog(false);
      setEduForm(defaultEdu);
    } catch {
      toast.error("添加失败，请重试");
    }
  };

  const handleAssignRole = async () => {
    if (!rolePrincipal.trim()) {
      toast.error("请输入 Principal ID");
      return;
    }
    try {
      const principal = Principal.fromText(rolePrincipal.trim());
      await assignRole.mutateAsync({
        user: principal,
        role: selectedRole as UserRole,
      });
      toast.success("角色已分配");
      setRolePrincipal("");
    } catch {
      toast.error("分配失败，请检查 Principal ID 是否正确");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4 bg-sidebar">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm font-semibold">AuthServer</span>
          <span className="font-mono text-xs text-muted-foreground">
            /admin
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono hidden sm:block">
              {ownPrincipal?.toText().slice(0, 20)}...
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            退出登录
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">管理面板</h1>
            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
              Admin
            </Badge>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="bg-muted/50 border border-border mb-6">
              <TabsTrigger value="profile" className="gap-2 text-sm">
                <User className="w-3.5 h-3.5" />
                我的简历
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2 text-sm">
                <Shield className="w-3.5 h-3.5" />
                角色管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-semibold text-sm flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-primary" />
                  基本信息
                </h2>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : resume ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">姓名</p>
                      <p className="font-medium">{resume.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">邮箱</p>
                      <p className="font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        {resume.email || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">职位</p>
                      <p className="font-medium">{resume.position || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">公司</p>
                      <p className="font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {resume.company || "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无简历数据</p>
                )}
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    工作经历
                  </h2>
                  <Button
                    data-ocid="user_form.add_work_experience_button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => setWorkExpDialog(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加
                  </Button>
                </div>
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : resume?.workExperiences &&
                  resume.workExperiences.length > 0 ? (
                  <div className="space-y-3" data-ocid="admin.user_list">
                    {resume.workExperiences.map((exp, i) => (
                      <motion.div
                        key={`${exp.company}-${exp.title}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        data-ocid={`admin.user.item.${i + 1}`}
                        className="border border-border rounded-md p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{exp.title}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {exp.company}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(exp.startDate)} —{" "}
                            {exp.endDate ? formatDate(exp.endDate) : "至今"}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {exp.description}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div
                    data-ocid="admin.work_experience.empty_state"
                    className="text-center py-8 text-sm text-muted-foreground"
                  >
                    暂无工作经历，点击"添加"开始记录
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    教育背景
                  </h2>
                  <Button
                    data-ocid="user_form.add_education_button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => setEduDialog(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加
                  </Button>
                </div>
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : resume?.educations && resume.educations.length > 0 ? (
                  <div className="space-y-3">
                    {resume.educations.map((edu) => (
                      <div
                        key={`${edu.school}-${edu.degree}`}
                        className="border border-border rounded-md p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{edu.school}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {edu.degree} · {edu.major}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(edu.startDate)} —{" "}
                            {edu.endDate ? formatDate(edu.endDate) : "至今"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    data-ocid="admin.education.empty_state"
                    className="text-center py-8 text-sm text-muted-foreground"
                  >
                    暂无教育背景，点击"添加"开始记录
                  </div>
                )}
              </div>

              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  您的 Principal ID
                </p>
                <p className="font-mono text-xs text-foreground break-all">
                  {ownPrincipal?.toText() || "加载中..."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-primary" />
                  分配用户角色
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  输入用户的 Principal ID 并选择要分配的角色。
                </p>
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      用户 Principal ID
                    </Label>
                    <Input
                      data-ocid="user_form.name_input"
                      value={rolePrincipal}
                      onChange={(e) => setRolePrincipal(e.target.value)}
                      placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                      className="font-mono text-xs bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      角色
                    </Label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger
                        data-ocid="user_form.select"
                        className="bg-input border-border text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="admin">admin — 管理员</SelectItem>
                        <SelectItem value="user">user — 普通用户</SelectItem>
                        <SelectItem value="guest">guest — 访客</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    data-ocid="user_form.save_button"
                    onClick={handleAssignRole}
                    disabled={assignRole.isPending || !rolePrincipal.trim()}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {assignRole.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    分配角色
                  </Button>
                </div>
                <Separator className="my-6 bg-border" />
                <div className="bg-muted/30 border border-border rounded-md p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-sm mb-2">
                    角色说明
                  </p>
                  <p>
                    • <span className="text-primary">admin</span> —
                    可访问管理面板，管理所有用户数据和角色
                  </p>
                  <p>
                    • <span className="text-accent">user</span> — 可使用 API
                    Token 访问个人简历接口
                  </p>
                  <p>
                    • <span className="text-muted-foreground">guest</span> —
                    仅可查看公开文档，无法访问个人数据
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Work Exp Dialog */}
      <Dialog open={workExpDialog} onOpenChange={setWorkExpDialog}>
        <DialogContent
          data-ocid="user_form.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              添加工作经历
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  公司名称 *
                </Label>
                <Input
                  data-ocid="user_form.company_input"
                  value={workExpForm.company}
                  onChange={(e) =>
                    setWorkExpForm((p) => ({ ...p, company: e.target.value }))
                  }
                  placeholder="字节跳动"
                  className="bg-input border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">职位 *</Label>
                <Input
                  data-ocid="user_form.position_input"
                  value={workExpForm.title}
                  onChange={(e) =>
                    setWorkExpForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="高级工程师"
                  className="bg-input border-border text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  开始日期 *
                </Label>
                <Input
                  type="date"
                  value={workExpForm.startDate}
                  onChange={(e) =>
                    setWorkExpForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="bg-input border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  结束日期（可选）
                </Label>
                <Input
                  type="date"
                  value={workExpForm.endDate}
                  onChange={(e) =>
                    setWorkExpForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="bg-input border-border text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">工作描述</Label>
              <Textarea
                data-ocid="user_form.textarea"
                value={workExpForm.description}
                onChange={(e) =>
                  setWorkExpForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="负责核心业务系统设计与开发..."
                className="bg-input border-border text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="user_form.cancel_button"
              variant="outline"
              onClick={() => {
                setWorkExpDialog(false);
                setWorkExpForm(defaultWorkExp);
              }}
            >
              取消
            </Button>
            <Button
              data-ocid="user_form.save_button"
              onClick={handleAddWorkExp}
              disabled={addWorkExp.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {addWorkExp.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={eduDialog} onOpenChange={setEduDialog}>
        <DialogContent
          data-ocid="user_form.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              添加教育背景
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                学校名称 *
              </Label>
              <Input
                data-ocid="user_form.name_input"
                value={eduForm.school}
                onChange={(e) =>
                  setEduForm((p) => ({ ...p, school: e.target.value }))
                }
                placeholder="清华大学"
                className="bg-input border-border text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">学历 *</Label>
                <Input
                  data-ocid="user_form.email_input"
                  value={eduForm.degree}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, degree: e.target.value }))
                  }
                  placeholder="本科"
                  className="bg-input border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">专业</Label>
                <Input
                  value={eduForm.major}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, major: e.target.value }))
                  }
                  placeholder="计算机科学"
                  className="bg-input border-border text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  开始日期 *
                </Label>
                <Input
                  type="date"
                  value={eduForm.startDate}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="bg-input border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  结束日期（可选）
                </Label>
                <Input
                  type="date"
                  value={eduForm.endDate}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="bg-input border-border text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="user_form.cancel_button"
              variant="outline"
              onClick={() => {
                setEduDialog(false);
                setEduForm(defaultEdu);
              }}
            >
              取消
            </Button>
            <Button
              data-ocid="user_form.save_button"
              onClick={handleAddEdu}
              disabled={addEdu.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {addEdu.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border px-6 py-4 text-center">
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
      </footer>
    </div>
  );
}
