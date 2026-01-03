import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
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
  AlertCircle,
  BookOpen
} from "lucide-react";

const TeacherDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const syllabusFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [overviewData, comparisonData] = await Promise.all([
        apiClient.getTeacherOverview(user.id),
        apiClient.getTopicComparison(user.id)
      ]);
      
      setOverview(overviewData);
      
      // Transform chart data
      if (comparisonData.data && comparisonData.data.length > 0) {
        setChartData(comparisonData.data.map((item: any) => ({
          topic: item.topic.length > 15 ? item.topic.substring(0, 15) + "..." : item.topic,
          fullTopic: item.topic,
          average: item.average || 0,
          ...comparisonData.students.reduce((acc: any, student: string) => ({
            ...acc,
            [student]: item[student] || 0
          }), {})
        })));
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!user?.id) return;
    
    try {
      const result = await apiClient.generateAccessCode(user.id);
      setCurrentCode(result.code);
      setCodeExpiry(new Date(result.expires_at));
      
      toast({
        title: "Access Code Generated",
        description: `Code: ${result.code} - Valid for 1 hour`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate access code",
        variant: "destructive",
      });
    }
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

  const handleSyllabusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.name.endsWith('.pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingSyllabus(true);
      const result = await apiClient.uploadSyllabus(user.id, file);
      
      toast({
        title: "Syllabus uploaded!",
        description: `Extracted ${result.topics.length} topics`,
      });
      
      // Reload dashboard data
      await loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload syllabus",
        variant: "destructive",
      });
    } finally {
      setUploadingSyllabus(false);
      if (syllabusFileRef.current) {
        syllabusFileRef.current.value = "";
      }
    }
  };

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
  const studentNames = overview?.topic_statistics 
    ? Object.keys(Object.values(overview.topic_statistics)[0]?.student_scores || {})
    : [];

  const stats = overview ? [
    {
      label: "Total Students",
      value: overview.total_students || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Topics Analyzed",
      value: overview.topics_analyzed || 0,
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Avg Understanding",
      value: `${Math.round(overview.average_understanding || 0)}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Pending Analysis",
      value: overview.pending_analysis || 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ] : [];

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

        {/* Syllabus Upload */}
        <Card className="chart-container border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Upload Syllabus
            </CardTitle>
            <CardDescription>
              Upload syllabus PDF to extract topics for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                ref={syllabusFileRef}
                type="file"
                accept=".pdf"
                onChange={handleSyllabusUpload}
                className="flex-1"
                disabled={uploadingSyllabus}
              />
              {uploadingSyllabus && (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
            </div>
          </CardContent>
        </Card>

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
              <Button onClick={handleGenerateCode} className="gap-2" disabled={loading}>
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
        {loading ? (
          <Card className="chart-container">
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ) : chartData.length > 0 ? (
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
                        fill={colors[index % colors.length]} 
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="chart-container">
            <CardContent className="p-12">
              <p className="text-center text-muted-foreground">
                No data available. Upload a syllabus and wait for students to submit answer sheets.
              </p>
            </CardContent>
          </Card>
        )}

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
            {overview?.recent_uploads && overview.recent_uploads.length > 0 ? (
              <div className="space-y-3">
                {overview.recent_uploads.map((upload: any) => (
                  <div 
                    key={upload.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{upload.student_name}</p>
                        <p className="text-sm text-muted-foreground">{upload.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(upload.upload_date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(upload.status)}
                        <span className="text-sm capitalize">{upload.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No uploads yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
