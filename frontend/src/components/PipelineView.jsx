import React, { useState, useEffect } from 'react';
import { gitlabService } from '../services/api';
import { Play, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import './PipelineView.css';

const PipelineView = ({ projectId, limit }) => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadPipelines();
  }, [projectId]);

  const loadPipelines = async () => {
    try {
      setLoading(true);
      const pipelinesData = await gitlabService.getPipelines(projectId);
      setPipelines(limit ? pipelinesData.slice(0, limit) : pipelinesData);
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPipeline = async () => {
    try {
      setTriggering(true);
      await gitlabService.triggerPipeline(projectId);
      // Reload pipelines after a short delay to see the new one
      setTimeout(loadPipelines, 2000);
    } catch (error) {
      console.error('Failed to trigger pipeline:', error);
      alert('Failed to trigger pipeline. Please try again.');
    } finally {
      setTriggering(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="status-success" />;
      case 'failed':
        return <XCircle size={16} className="status-failed" />;
      case 'running':
        return <RefreshCw size={16} className="status-running" />;
      case 'pending':
        return <Clock size={16} className="status-pending" />;
      default:
        return <AlertCircle size={16} className="status-unknown" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return 'Success';
      case 'failed': return 'Failed';
      case 'running': return 'Running';
      case 'pending': return 'Pending';
      case 'canceled': return 'Canceled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading pipelines...</p>
      </div>
    );
  }

  return (
    <div className="pipeline-view">
      {!limit && (
        <div className="pipeline-header">
          <h3>CI/CD Pipelines</h3>
          <button 
            className="btn btn-primary"
            onClick={handleTriggerPipeline}
            disabled={triggering}
          >
            {triggering ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Triggering...
              </>
            ) : (
              <>
                <Play size={16} />
                Trigger Pipeline
              </>
            )}
          </button>
        </div>
      )}

      {pipelines.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={32} />
          <p>No pipelines found</p>
        </div>
      ) : (
        <div className="pipelines-list">
          {pipelines.map(pipeline => (
            <div key={pipeline.id} className="pipeline-card">
              <div className="pipeline-main">
                <div className="pipeline-status">
                  {getStatusIcon(pipeline.status)}
                  <span className={`status-text status-${pipeline.status}`}>
                    {getStatusText(pipeline.status)}
                  </span>
                </div>
                
                <div className="pipeline-info">
                  <div className="pipeline-ref">
                    <strong>Branch:</strong> {pipeline.ref}
                  </div>
                  <div className="pipeline-commit">
                    {pipeline.sha?.substring(0, 8) || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="pipeline-meta">
                <div className="pipeline-duration">
                  {pipeline.duration ? `${pipeline.duration}s` : 'N/A'}
                </div>
                <div className="pipeline-time">
                  {new Date(pipeline.created_at).toLocaleDateString()} at{' '}
                  {new Date(pipeline.created_at).toLocaleTimeString()}
                </div>
              </div>

              {pipeline.status === 'running' && (
                <div className="pipeline-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!limit && pipelines.length > 0 && (
        <div className="pipeline-stats">
          <div className="stat">
            <span className="stat-label">Success:</span>
            <span className="stat-value success">
              {pipelines.filter(p => p.status === 'success').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Failed:</span>
            <span className="stat-value failed">
              {pipelines.filter(p => p.status === 'failed').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Running:</span>
            <span className="stat-value running">
              {pipelines.filter(p => p.status === 'running').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{pipelines.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineView;