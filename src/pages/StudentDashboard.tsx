import React, { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { topicData } from "@/lib/mockData";
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
  AlertTriangle
} from "lucide-react";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get student-specific data
  const studentName = user?.name || "Student";
  const firstName = studentName.split(" ")[0];

  const studentTopicData = topicData.map((topic) => {
    const studentData = topic.students.find((s) => s.name === studentName);
    return {
      topic: topic.topic,
      shortTopic: topic.topic.length > 12 ? topic.topic.substring(0, 12) + "..." : topic.topic,
      understanding: studentData?.understanding || 0,
      classAverage: topic.avgUnderstanding,
    };
  });

  const averageUnderstanding = Math.round(
    studentTopicData.reduce((acc, t) => acc + t.understanding, 0) / studentTopicData.length
  );

  const strongTopics = studentTopicData.filter((t) => t.understanding >= 80);
  const weakTopics = studentTopicData.filter((t) => t.understanding < 65);

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
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate upload completion
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Upload successful!",
        description: "Your answer sheet is being processed by AI",
      });
    }, 2500);
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
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>Processing...</>
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
                    dataKey="topic" 
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
                  {strongTopics.map((topic) => (
                    <div 
                      key={topic.topic}
                      className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-success" />
                        <span className="font-medium">{topic.topic}</span>
                      </div>
                      <span className="text-success font-bold">{topic.understanding}%</span>
                    </div>
                  ))}
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
                  {weakTopics.map((topic) => (
                    <div 
                      key={topic.topic}
                      className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-warning" />
                        <span className="font-medium">{topic.topic}</span>
                      </div>
                      <span className="text-warning font-bold">{topic.understanding}%</span>
                    </div>
                  ))}
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
