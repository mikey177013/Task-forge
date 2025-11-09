import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gitlab_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gitlab_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  async login(token) {
    const response = await api.post('/gitlab/auth', { token });
    return response.data;
  },

  async logout() {
    const response = await api.post('/gitlab/logout');
    return response.data;
  },

  async verifyToken(token) {
    const response = await api.get('/gitlab/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { username: 'verified', token };
  }
};

// GitLab services
export const gitlabService = {
  // Projects
  async getProjects() {
    const response = await api.get('/gitlab/projects');
    return response.data;
  },

  async getProjectDetails(projectId) {
    const response = await api.get(`/gitlab/projects/${projectId}`);
    return response.data;
  },

  async getProjectStats(projectId) {
    const response = await api.get(`/gitlab/projects/${projectId}/stats`);
    return response.data;
  },

  // Issues
  async getProjectIssues(projectId, filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    
    const response = await api.get(`/gitlab/projects/${projectId}/issues?${params}`);
    return response.data;
  },

  async createIssue(projectId, issueData) {
    const response = await api.post(`/gitlab/projects/${projectId}/issues`, issueData);
    return response.data;
  },

  async updateIssue(projectId, issueId, updates) {
    const response = await api.put(`/gitlab/projects/${projectId}/issues/${issueId}`, updates);
    return response.data;
  },

  async addComment(projectId, issueId, comment) {
    const response = await api.post(`/gitlab/projects/${projectId}/issues/${issueId}/notes`, {
      body: comment
    });
    return response.data;
  },

  // Pipelines
  async getPipelines(projectId) {
    const response = await api.get(`/gitlab/projects/${projectId}/pipelines`);
    return response.data;
  },

  async triggerPipeline(projectId, ref = 'main') {
    const response = await api.post(`/gitlab/projects/${projectId}/pipelines`, { ref });
    return response.data;
  },

  // Events
  async getUserEvents() {
    const response = await api.get('/gitlab/events');
    return response.data;
  },

  async getProjectEvents(projectId) {
    const response = await api.get(`/gitlab/projects/${projectId}/events`);
    return response.data;
  }
};

// AI services
export const aiService = {
  async generateProjectSummary(projectId) {
    const response = await api.post(`/ai/summary/project/${projectId}`);
    return response.data;
  },

  async generateWeeklySummary() {
    const response = await api.post('/ai/summary/weekly');
    return response.data;
  }
};

export default api;