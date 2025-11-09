const gitlabService = require('../services/gitlabService');
const cacheService = require('../services/cacheService');

class GitLabController {
  // Authentication
  async authenticate(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Personal Access Token is required' });
      }

      // Verify token by making a test API call
      const user = await gitlabService.verifyToken(token);
      if (user) {
        req.session.gitlabToken = token;
        req.session.userId = user.id;
        req.session.username = user.username;
        
        // Cache user info
        cacheService.set(`user_${user.id}`, user, 3600);
        
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar_url: user.avatar_url
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  async logout(req, res) {
    try {
      req.session.destroy();
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Projects
  async getProjects(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projects = await gitlabService.getProjects(token);
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  async getProjectDetails(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      const project = await gitlabService.getProjectDetails(token, projectId);
      res.json(project);
    } catch (error) {
      console.error('Get project details error:', error);
      res.status(500).json({ error: 'Failed to fetch project details' });
    }
  }

  // Issues
  async getProjectIssues(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      const { state, labels } = req.query;
      
      const issues = await gitlabService.getProjectIssues(token, projectId, { state, labels });
      res.json(issues);
    } catch (error) {
      console.error('Get issues error:', error);
      res.status(500).json({ error: 'Failed to fetch issues' });
    }
  }

  async createIssue(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      const { title, description, labels } = req.body;

      const issue = await gitlabService.createIssue(token, projectId, {
        title,
        description,
        labels: labels || []
      });

      res.json(issue);
    } catch (error) {
      console.error('Create issue error:', error);
      res.status(500).json({ error: 'Failed to create issue' });
    }
  }

  async updateIssue(req, res) {
    try {
      const token = req.session.gitlabToken;
      const { id: projectId, issueId } = req.params;
      const updates = req.body;

      const issue = await gitlabService.updateIssue(token, projectId, issueId, updates);
      res.json(issue);
    } catch (error) {
      console.error('Update issue error:', error);
      res.status(500).json({ error: 'Failed to update issue' });
    }
  }

  async addComment(req, res) {
    try {
      const token = req.session.gitlabToken;
      const { id: projectId, issueId } = req.params;
      const { body } = req.body;

      const comment = await gitlabService.addComment(token, projectId, issueId, body);
      res.json(comment);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  // Pipelines
  async getPipelines(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      const { per_page = 5 } = req.query;

      const pipelines = await gitlabService.getPipelines(token, projectId, { per_page });
      res.json(pipelines);
    } catch (error) {
      console.error('Get pipelines error:', error);
      res.status(500).json({ error: 'Failed to fetch pipelines' });
    }
  }

  async triggerPipeline(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      const { ref = 'main' } = req.body;

      const pipeline = await gitlabService.triggerPipeline(token, projectId, ref);
      res.json(pipeline);
    } catch (error) {
      console.error('Trigger pipeline error:', error);
      res.status(500).json({ error: 'Failed to trigger pipeline' });
    }
  }

  // Events and Activities
  async getUserEvents(req, res) {
    try {
      const token = req.session.gitlabToken;
      const userId = req.session.userId;
      const events = await gitlabService.getUserEvents(token, userId);
      res.json(events);
    } catch (error) {
      console.error('Get user events error:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  async getProjectEvents(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      const events = await gitlabService.getProjectEvents(token, projectId);
      res.json(events);
    } catch (error) {
      console.error('Get project events error:', error);
      res.status(500).json({ error: 'Failed to fetch project events' });
    }
  }

  // Stats
  async getProjectStats(req, res) {
    try {
      const token = req.session.gitlabToken;
      const projectId = req.params.id;
      
      const cacheKey = `stats_${projectId}`;
      const cachedStats = cacheService.get(cacheKey);
      
      if (cachedStats) {
        return res.json(cachedStats);
      }

      const stats = await gitlabService.getProjectStats(token, projectId);
      cacheService.set(cacheKey, stats, 300); // Cache for 5 minutes
      
      res.json(stats);
    } catch (error) {
      console.error('Get project stats error:', error);
      res.status(500).json({ error: 'Failed to fetch project stats' });
    }
  }
}

module.exports = new GitLabController();