const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

interface ApiError {
  detail: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "An error occurred",
      }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async requestWithFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const formData = new FormData();
    formData.append("file", file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "An error occurred",
      }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{
      id: number;
      email: string;
      name: string;
      role: string;
      student_id?: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async loginWithCode(accessCode: string, studentId: string) {
    return this.request<{
      id: number;
      email: string;
      name: string;
      role: string;
      student_id?: string;
    }>("/api/auth/login-code", {
      method: "POST",
      body: JSON.stringify({
        access_code: accessCode,
        student_id: studentId,
      }),
    });
  }

  // Teacher endpoints
  async generateAccessCode(teacherId: number) {
    return this.request<{
      code: string;
      expires_at: string;
      created_at: string;
    }>("/api/teachers/access-codes/generate", {
      method: "POST",
      body: JSON.stringify({ teacher_id: teacherId }),
    });
  }

  async getActiveCodes(teacherId: number) {
    return this.request<
      Array<{
        code: string;
        expires_at: string;
        created_at: string;
      }>
    >(`/api/teachers/access-codes?teacher_id=${teacherId}`);
  }

  async uploadSyllabus(teacherId: number, file: File) {
    const url = `${this.baseUrl}/api/teachers/syllabus/upload?teacher_id=${teacherId}`;
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "An error occurred",
      }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getSyllabus(teacherId: number) {
    return this.request<{
      id: number;
      topics: string[];
      created_at: string;
    }>(`/api/teachers/syllabus?teacher_id=${teacherId}`);
  }

  // Student endpoints
  async uploadAnswerSheet(
    studentId: number,
    accessCode: string,
    file: File
  ) {
    const url = `${this.baseUrl}/api/students/answer-sheets/upload?student_id=${studentId}&access_code=${accessCode}`;
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "An error occurred",
      }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAnswerSheets(studentId: number) {
    return this.request<
      Array<{
        id: number;
        file_name: string;
        status: string;
        created_at: string;
        processed_at: string | null;
      }>
    >(`/api/students/answer-sheets?student_id=${studentId}`);
  }

  // Analytics endpoints
  async getTeacherOverview(teacherId: number) {
    return this.request<{
      total_students: number;
      topics_analyzed: number;
      average_understanding: number;
      pending_analysis: number;
      topic_statistics: Record<
        string,
        {
          average: number;
          student_scores: Record<string, number>;
        }
      >;
      recent_uploads: Array<{
        id: number;
        student_name: string;
        file_name: string;
        status: string;
        upload_date: string;
      }>;
    }>(`/api/analytics/teacher/${teacherId}/overview`);
  }

  async getStudentPerformance(studentId: number) {
    return this.request<{
      student_name: string;
      overall_average: number;
      topic_scores: Record<string, number>;
      class_averages: Record<string, number>;
      strong_topics: string[];
      weak_topics: string[];
    }>(`/api/analytics/student/${studentId}/performance`);
  }

  async getTopicComparison(teacherId: number) {
    return this.request<{
      topics: string[];
      data: Array<Record<string, number | string>>;
      students: string[];
    }>(`/api/analytics/teacher/${teacherId}/topic-comparison`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

