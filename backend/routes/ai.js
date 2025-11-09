const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.gitlabToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * @route POST /api/ai/summary/project/:id
 * @description Generate AI summary for a specific project
 * @access Private
 */
router.post('/summary/project/:id', requireAuth, aiController.generateProjectSummary);

/**
 * @route POST /api/ai/summary/weekly
 * @description Generate weekly summary of user activity
 * @access Private
 */
router.post('/summary/weekly', requireAuth, aiController.generateWeeklySummary);

/**
 * @route POST /api/ai/summary/issues
 * @description Generate summary of project issues (alternative endpoint)
 * @access Private
 */
router.post('/summary/issues', requireAuth, aiController.generateIssuesSummary);

/**
 * @route GET /api/ai/health
 * @description Check AI service health and configuration
 * @access Private
 */
router.get('/health', requireAuth, (req, res) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  res.json({
    service: 'AI Summary Service',
    status: 'operational',
    openai_configured: hasOpenAIKey,
    features: {
      project_summaries: true,
      weekly_summaries: true,
      issue_analysis: true,
      fallback_summaries: true
    }
  });
});

module.exports = router;