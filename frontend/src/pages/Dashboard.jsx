import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { gitlabService, aiService } from '../services/api';
import IssueBoard from '../components/IssueBoard';
import PipelineView from '../components/PipelineView';
import AiSummary from '../components/AiSummary';
import ActivityFeed from '../components/ActivityFeed';
import { Gitlab, AlertCircle, GitBranch, PlayCircle, Activity } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, statsData] = await Promise.all([
        gitlabService.getProjectDetails(id),
        gitlabService.getProjectStats(id)
      ]);
      setProject(projectData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadProjectData();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading project dashboard...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h2>Project not found</h2>
          <p>The requested project could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Project Header */}
      <div className="dashboard-header">
        <div className="project-info">
          <div className="project-title">
            <Gitlab size={24} className="project-icon" />
            <h1>{project.name}</h1>
          </div>
          <p className="project-description">{project.description}</p>
          <div className="project-meta">
            <span>Last activity: {new Date(project.last_activity_at).toLocaleDateString()}</span>
            <a 
              href={project.web_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              Open in GitLab
            </a>
          </div>
        </div>

        {stats && (
          <div className="stats-overview grid-4">
            <div className="stat-card">
              <div className="stat-icon issues">
                <AlertCircle size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.issues?.open || 0}</div>
                <div className="stat-label">Open Issues</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon merge-requests">
                <GitBranch size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.mergeRequests?.open || 0}</div>
                <div className="stat-label">Open MRs</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pipelines">
                <PlayCircle size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.pipelines?.success || 0}</div>
                <div className="stat-label">Successful Pipelines</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon activity">
                <Activity size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.pipelines?.recent?.length || 0}</div>
                <div className="stat-label">Recent Pipelines</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Issue Board
        </button>
        <button 
          className={`tab ${activeTab === 'pipelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          CI/CD Pipelines
        </button>
        <button 
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI Summary
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity Feed
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="overview-column">
              <div className="card">
                <h3>Recent Issues</h3>
                <IssueBoard projectId={id} limit={5} />
              </div>
              <div className="card">
                <h3>AI Summary</h3>
                <AiSummary projectId={id} />
              </div>
            </div>
            <div className="overview-column">
              <div className="card">
                <h3>Recent Pipelines</h3>
                <PipelineView projectId={id} limit={5} />
              </div>
              <div className="card">
                <h3>Recent Activity</h3>
                <ActivityFeed projectId={id} limit={10} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="card">
            <IssueBoard projectId={id} />
          </div>
        )}

        {activeTab === 'pipelines' && (
          <div className="card">
            <PipelineView projectId={id} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="card">
            <AiSummary projectId={id} detailed />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card">
            <ActivityFeed projectId={id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;