const axios = require('axios');

class GitLabService {
  constructor() {
    this.baseURL = 'https://gitlab.com/api/v4';
  }

  getHeaders(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async makeRequest(method, endpoint, token, data = null) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method,
        url,
        headers: this.getHeaders(token),
        data
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`GitLab API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  // Authentication
  async verifyToken(token) {
    return this.makeRequest('GET', '/user', token);
  }

  // Projects
  async getProjects(token) {
    return this.makeRequest('GET', '/projects?membership=true&simple=true&order_by=last_activity_at&sort=desc', token);
  }

  async getProjectDetails(token, projectId) {
    return this.makeRequest('GET', `/projects/${encodeURIComponent(projectId)}`, token);
  }

  // Issues
  async getProjectIssues(token, projectId, filters = {}) {
    let endpoint = `/projects/${encodeURIComponent(projectId)}/issues`;
    
    const queryParams = new URLSearchParams();
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.labels) queryParams.append('labels', filters.labels);
    
    const queryString = queryParams.toString();
    if (queryString) endpoint += `?${queryString}`;

    return this.makeRequest('GET', endpoint, token);
  }

  async createIssue(token, projectId, issueData) {
    const endpoint = `/projects/${encodeURIComponent(projectId)}/issues`;
    return this.makeRequest('POST', endpoint, token, issueData);
  }

  async updateIssue(token, projectId, issueId, updates) {
    const endpoint = `/projects/${encodeURIComponent(projectId)}/issues/${issueId}`;
    return this.makeRequest('PUT', endpoint, token, updates);
  }

  async addComment(token, projectId, issueId, body) {
    const endpoint = `/projects/${encodeURIComponent(projectId)}/issues/${issueId}/notes`;
    return this.makeRequest('POST', endpoint, token, { body });
  }

  // Pipelines
  async getPipelines(token, projectId, options = {}) {
    const { per_page = 5 } = options;
    const endpoint = `/projects/${encodeURIComponent(projectId)}/pipelines?per_page=${per_page}&sort=desc`;
    return this.makeRequest('GET', endpoint, token);
  }

  async triggerPipeline(token, projectId, ref) {
    const endpoint = `/projects/${encodeURIComponent(projectId)}/pipeline`;
    return this.makeRequest('POST', endpoint, token, { ref });
  }

  // Events
  async getUserEvents(token, userId) {
    const endpoint = `/users/${userId}/events?per_page=20`;
    return this.makeRequest('GET', endpoint, token);
  }

  async getProjectEvents(token, projectId) {
    const endpoint = `/projects/${encodeURIComponent(projectId)}/events?per_page=20`;
    return this.makeRequest('GET', endpoint, token);
  }

  // Stats
  async getProjectStats(token, projectId) {
    try {
      const [project, issues, mergeRequests, pipelines] = await Promise.all([
        this.getProjectDetails(token, projectId),
        this.getProjectIssues(token, projectId, { state: 'opened' }),
        this.makeRequest('GET', `/projects/${encodeURIComponent(projectId)}/merge_requests?state=opened`, token),
        this.getPipelines(token, projectId, { per_page: 10 })
      ]);

      return {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          web_url: project.web_url
        },
        issues: {
          total: issues.length,
          open: issues.filter(issue => issue.state === 'opened').length,
          closed: issues.filter(issue => issue.state === 'closed').length
        },
        mergeRequests: {
          total: mergeRequests.length,
          open: mergeRequests.filter(mr => mr.state === 'opened').length,
          merged: mergeRequests.filter(mr => mr.state === 'merged').length
        },
        pipelines: {
          recent: pipelines.slice(0, 5),
          success: pipelines.filter(p => p.status === 'success').length,
          failed: pipelines.filter(p => p.status === 'failed').length,
          running: pipelines.filter(p => p.status === 'running').length
        },
        lastActivity: project.last_activity_at
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
  }
}

module.exports = new GitLabService();