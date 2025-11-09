const gitlabService = require('../services/gitlabService');
const aiService = require('../services/aiService');

class AIController {
  async generateProjectSummary(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      
      // Get recent project data
      const [issues, mergeRequests, pipelines, events] = await Promise.all([
        gitlabService.getProjectIssues(token, projectId),
        gitlabService.makeRequest('GET', `/projects/${encodeURIComponent(projectId)}/merge_requests?per_page=10`, token),
        gitlabService.getPipelines(token, projectId, { per_page: 10 }),
        gitlabService.getProjectEvents(token, projectId)
      ]);

      const summary = await aiService.generateProjectSummary({
        issues,
        mergeRequests,
        pipelines,
        events
      });

      res.json({ summary });
    } catch (error) {
      console.error('Generate project summary error:', error);
      res.status(500).json({ error: 'Failed to generate project summary' });
    }
  }

  async generateWeeklySummary(req, res) {
    try {
      const token = req.session.gitlabToken;
      const userId = req.session.userId;
      
      // Get user events from the past week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const events = await gitlabService.makeRequest(
        'GET', 
        `/users/${userId}/events?after=${oneWeekAgo.toISOString().split('T')[0]}&per_page=50`, 
        token
      );

      const summary = await aiService.generateWeeklySummary(events);
      res.json({ summary });
    } catch (error) {
      console.error('Generate weekly summary error:', error);
      res.status(500).json({ error: 'Failed to generate weekly summary' });
    }
  }
}

module.exports = new AIController();