import { useState, useRef, useEffect, FC } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  TrendingUp,
  BookOpen,
  Target,
  Award,
  AlertTriangle,
  Loader2
} from "lucide-react";

const StudentDashboard: FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accessCodeInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get student-specific data
  const studentName = user?.name || "Student";
  const firstName = studentName.split(" ")[0];

  useEffect(() => {
    if (user?.id) {
      loadPerformanceData();
    }
  }, [user]);

  const loadPerformanceData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getStudentPerformance(user.id);
      setPerformance(data);
    } catch (error: any) {
      console.error("Error loading performance:", error);
      // Don't show error if no data exists yet
    } finally {
      setLoading(false);
    }
  };

  const studentTopicData = performance ? Object.keys(performance.topic_scores || {}).map((topic) => ({
    topic: topic,
    shortTopic: topic.length > 12 ? topic.substring(0, 12) + "..." : topic,
    understanding: performance.topic_scores[topic] || 0,
    classAverage: performance.class_averages?.[topic] || 0,
  })) : [];

  const averageUnderstanding = performance?.overall_average || 0;
  const strongTopics = performance?.strong_topics || [];
  const weakTopics = performance?.weak_topics || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    if (!accessCode.trim()) {
      toast({
        title: "Access code required",
        description: "Please enter the access code from your teacher",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await apiClient.uploadAnswerSheet(user.id, accessCode.trim(), selectedFile);
      setUploadProgress(100);
      
      toast({
        title: "Upload successful!",
        description: "Your answer sheet is being processed by AI",
      });
      
      // Reset form
      setSelectedFile(null);
      setAccessCode("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (accessCodeInputRef.current) {
        accessCodeInputRef.current.value = "";
      }
      
      // Reload performance data after a delay
      setTimeout(() => {
        loadPerformanceData();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload answer sheet",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getBarColor = (value: number) => {
    if (value >= 80) return "hsl(var(--success))";
    if (value >= 65) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const radialData = [
    {
      name: "Understanding",
      value: averageUnderstanding,
      fill: "hsl(var(--primary))",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome, {firstName}!</h1>
          <p className="text-muted-foreground mt-1">
            Track your learning progress and upload answer sheets
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      data={radialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={{ fill: "hsl(var(--muted))" }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                  <p className="text-3xl font-bold">{averageUnderstanding}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Strong Topics</p>
                  <p className="text-3xl font-bold text-success">{strongTopics.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Improvement</p>
                  <p className="text-3xl font-bold text-warning">{weakTopics.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="chart-container border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Answer Sheet
            </CardTitle>
            <CardDescription>
              Upload your exam answer sheet in PDF format for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  ref={accessCodeInputRef}
                  id="accessCode"
                  type="text"
                  placeholder="Enter access code from teacher"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="uppercase tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Get this code from your teacher
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                  disabled={isUploading}
                />
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || !accessCode.trim() || isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
              
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading and processing... {uploadProgress}%
                  </p>
                </div>
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
        ) : studentTopicData.length > 0 ? (
          <Card className="chart-container">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Topic Understanding
              </CardTitle>
              <CardDescription>
                How well you understand each topic compared to class average
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={studentTopicData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis 
                      dataKey="shortTopic" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number, name: string) => [
                        `${value}%`, 
                        name === "understanding" ? "Your Score" : "Class Average"
                      ]}
                      labelFormatter={(label) => {
                        const item = studentTopicData.find(d => d.shortTopic === label);
                        return item?.topic || label;
                      }}
                    />
                    <Bar 
                      dataKey="understanding" 
                      name="Your Score"
                      radius={[0, 4, 4, 0]}
                    >
                      {studentTopicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.understanding)} />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="classAverage" 
                      name="Class Average"
                      fill="hsl(var(--muted-foreground))"
                      opacity={0.4}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="chart-container">
            <CardContent className="p-12">
              <p className="text-center text-muted-foreground">
                No performance data yet. Upload an answer sheet to get started.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Topic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Topics */}
          <Card className="chart-container">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5" />
                Strong Topics
              </CardTitle>
              <CardDescription>Topics where you excel</CardDescription>
            </CardHeader>
            <CardContent>
              {strongTopics.length > 0 ? (
                <div className="space-y-3">
                  {strongTopics.map((topic: string) => {
                    const score = performance?.topic_scores?.[topic] || 0;
                    return (
                      <div 
                        key={topic}
                        className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-success" />
                          <span className="font-medium">{topic}</span>
                        </div>
                        <span className="text-success font-bold">{score}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Keep studying to excel in topics!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Topics to Improve */}
          <Card className="chart-container">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Focus Areas
              </CardTitle>
              <CardDescription>Topics that need more attention</CardDescription>
            </CardHeader>
            <CardContent>
              {weakTopics.length > 0 ? (
                <div className="space-y-3">
                  {weakTopics.map((topic: string) => {
                    const score = performance?.topic_scores?.[topic] || 0;
                    return (
                      <div 
                        key={topic}
                        className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-warning" />
                          <span className="font-medium">{topic}</span>
                        </div>
                        <span className="text-warning font-bold">{score}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Great job! No weak topics found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
