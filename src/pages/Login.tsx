import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Users, BookOpen, Key, Mail, Lock, User } from "lucide-react";
import { demoAccounts } from "@/lib/mockData";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithCode } = useAuth();
  const { toast } = useToast();
  
  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Code login state
  const [accessCode, setAccessCode] = useState("");
  const [studentId, setStudentId] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await loginWithCode(accessCode.toUpperCase(), studentId.toUpperCase());
    
    if (success) {
      toast({
        title: "Welcome!",
        description: "You have successfully logged in with access code.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid access code or student ID. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const fillDemoCredentials = (type: "teacher" | "student1" | "student2" | "student3") => {
    if (type === "teacher") {
      setEmail(demoAccounts.teacher.email);
      setPassword(demoAccounts.teacher.password);
    } else {
      const index = parseInt(type.replace("student", "")) - 1;
      setEmail(demoAccounts.students[index].email);
      setPassword(demoAccounts.students[index].password);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">EduAnalytics</span>
          </div>
          <p className="text-white/80 text-lg max-w-md">
            AI-powered student performance analysis platform
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Smart Analysis</h3>
              <p className="text-white/70 text-sm">AI processes exam sheets to identify topic understanding</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Student Insights</h3>
              <p className="text-white/70 text-sm">Track individual and class-wide performance metrics</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 EduAnalytics. Empowering educators with data.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">EduAnalytics</span>
          </div>

          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-display">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-2">
                    <Key className="w-4 h-4" />
                    Access Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>

                  {/* Demo Accounts */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center mb-3">Demo Accounts</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials("teacher")}
                        className="text-xs"
                      >
                        Teacher Demo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials("student1")}
                        className="text-xs"
                      >
                        Student 1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials("student2")}
                        className="text-xs"
                      >
                        Student 2
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials("student3")}
                        className="text-xs"
                      >
                        Student 3
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code">
                  <form onSubmit={handleCodeLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="accessCode">Access Code</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="accessCode"
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                          className="pl-10 uppercase tracking-widest font-mono"
                          maxLength={6}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get this code from your teacher
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="studentId"
                          type="text"
                          placeholder="e.g., STU001"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                          className="pl-10 uppercase"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Access Portal"}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      Student IDs: STU001, STU002, STU003
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
