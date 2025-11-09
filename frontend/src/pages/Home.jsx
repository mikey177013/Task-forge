
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gitlabService } from '../services/api';
import { Gitlab, Star, GitBranch, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import './Home.css';

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await gitlabService.getProjects();
      setProjects(projectsData);
      
      // Load basic stats for each project
      const projectsWithStats = await Promise.all(
        projectsData.slice(0, 5).map(async (project) => {
          try {
            const stats = await gitlabService.getProjectStats(project.id);
            return { ...project, stats };
          } catch (error) {
            return project;
          }
        })
      );
      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPipelineStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="status-success" />;
      case 'failed':
        return <AlertCircle size={16} className="status-failed" />;
      case 'running':
        return <Clock size={16} className="status-running" />;
      default:
        return <Clock size={16} className="status-pending" />;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="home-header">
        <h1>Your Projects</h1>
        <p>Manage and monitor all your GitLab projects in one place</p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <Gitlab size={64} className="empty-icon" />
          <h2>No projects found</h2>
          <p>You don't have access to any GitLab projects or there was an error loading them.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div className="project-name">
                  <Gitlab size={20} />
                  <h3>{project.name}</h3>
                </div>
                {project.star_count > 0 && (
                  <div className="project-stars">
                    <Star size={16} />
                    <span>{project.star_count}</span>
                  </div>
                )}
              </div>

              <p className="project-description">
                {project.description || 'No description provided'}
              </p>

              {project.stats && (
                <div className="project-stats">
                  <div className="stat">
                    <AlertCircle size={16} />
                    <span>{project.stats.issues?.open || 0} open issues</span>
                  </div>
                  <div className="stat">
                    <GitBranch size={16} />
                    <span>{project.stats.mergeRequests?.open || 0} open MRs</span>
                  </div>
                  <div className="stat">
                    {getPipelineStatusIcon(project.stats.pipelines?.recent?.[0]?.status)}
                    <span>Pipeline: {project.stats.pipelines?.recent?.[0]?.status || 'unknown'}</span>
                  </div>
                </div>
              )}

              <div className="project-actions">
                <Link 
                  to={`/project/${project.id}`} 
                  className="btn btn-primary"
                >
                  View Dashboard
                </Link>
                <a 
                  href={project.web_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  Open in GitLab
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;