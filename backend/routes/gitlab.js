const express = require('express');
const router = express.Router();
const gitlabController = require('../controllers/gitlabController');

// Authentication routes
router.post('/auth', gitlabController.authenticate);
router.post('/logout', gitlabController.logout);

// Project routes
router.get('/projects', gitlabController.getProjects);
router.get('/projects/:id', gitlabController.getProjectDetails);

// Issues routes
router.get('/projects/:id/issues', gitlabController.getProjectIssues);
router.post('/projects/:id/issues', gitlabController.createIssue);
router.put('/projects/:id/issues/:issueId', gitlabController.updateIssue);
router.post('/projects/:id/issues/:issueId/notes', gitlabController.addComment);

// Pipeline routes
router.get('/projects/:id/pipelines', gitlabController.getPipelines);
router.post('/projects/:id/pipelines', gitlabController.triggerPipeline);

// Activity routes
router.get('/events', gitlabController.getUserEvents);
router.get('/projects/:id/events', gitlabController.getProjectEvents);

// Stats routes
router.get('/projects/:id/stats', gitlabController.getProjectStats);

module.exports = router;