import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { topicData, mockUploads, generateAccessCode, demoAccounts } from "@/lib/mockData";
import { addAccessCode } from "@/contexts/AuthContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  Copy,
  RefreshCw,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

const TeacherDashboard: React.FC = () => {
  const { toast } = useToast();
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);

  const handleGenerateCode = () => {
    const code = generateAccessCode();
    addAccessCode(code);
    setCurrentCode(code);
    setCodeExpiry(new Date(Date.now() + 60 * 60 * 1000));
    
    toast({
      title: "Access Code Generated",
      description: `Code: ${code} - Valid for 1 hour`,
    });
  };

  const handleCopyCode = () => {
    if (currentCode) {
      navigator.clipboard.writeText(currentCode);
      toast({
        title: "Copied!",
        description: "Access code copied to clipboard",
      });
    }
  };

  // Prepare chart data for topic comparison
  const chartData = topicData.map((topic) => ({
    topic: topic.topic.length > 15 ? topic.topic.substring(0, 15) + "..." : topic.topic,
    fullTopic: topic.topic,
    average: topic.avgUnderstanding,
    ...topic.students.reduce((acc, student) => ({
      ...acc,
      [student.name.split(" ")[0]]: student.understanding,
    }), {}),
  }));

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
  const studentNames = demoAccounts.students.map(s => s.name.split(" ")[0]);

  const stats = [
    {
      label: "Total Students",
      value: demoAccounts.students.length,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Topics Analyzed",
      value: topicData.length,
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Avg Understanding",
      value: `${Math.round(topicData.reduce((acc, t) => acc + t.avgUnderstanding, 0) / topicData.length)}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Pending Analysis",
      value: mockUploads.filter(u => u.status === "processing").length,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor student performance and manage assessments
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Access Code Generator */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Student Access Code
            </CardTitle>
            <CardDescription>
              Generate a temporary code for students to upload their answer sheets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={handleGenerateCode} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Generate New Code
              </Button>
              
              {currentCode && (
                <div className="flex items-center gap-3 bg-secondary px-4 py-3 rounded-lg">
                  <span className="font-mono text-2xl font-bold tracking-widest">
                    {currentCode}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {codeExpiry && (
                <p className="text-sm text-muted-foreground">
                  Expires: {codeExpiry.toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Topic Understanding Chart */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle>Topic Understanding by Student</CardTitle>
            <CardDescription>
              Comparison of student comprehension across different topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="topic" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Understanding %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.topic === label);
                      return item?.fullTopic || label;
                    }}
                  />
                  <Legend />
                  {studentNames.map((name, index) => (
                    <Bar 
                      key={name} 
                      dataKey={name} 
                      fill={colors[index]} 
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Recent Uploads
            </CardTitle>
            <CardDescription>
              Latest answer sheet submissions from students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUploads.map((upload) => (
                <div 
                  key={upload.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{upload.studentName}</p>
                      <p className="text-sm text-muted-foreground">{upload.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(upload.uploadDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-sm capitalize">{upload.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
