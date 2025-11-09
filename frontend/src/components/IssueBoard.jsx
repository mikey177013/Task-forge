import React, { useState, useEffect } from 'react';
import { gitlabService } from '../services/api';
import { Plus, MessageSquare, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import './IssueBoard.css';

const IssueBoard = ({ projectId, limit }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: '',
    labels: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    labels: ''
  });

  useEffect(() => {
    loadIssues();
  }, [projectId, filters]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const issuesData = await gitlabService.getProjectIssues(projectId, filters);
      setIssues(limit ? issuesData.slice(0, limit) : issuesData);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      await gitlabService.createIssue(projectId, {
        title: newIssue.title,
        description: newIssue.description,
        labels: newIssue.labels.split(',').map(label => label.trim()).filter(label => label)
      });
      
      setNewIssue({ title: '', description: '', labels: '' });
      setShowCreateForm(false);
      loadIssues(); // Refresh the list
    } catch (error) {
      console.error('Failed to create issue:', error);
      alert('Failed to create issue. Please try again.');
    }
  };

  const handleUpdateIssue = async (issueId, updates) => {
    try {
      await gitlabService.updateIssue(projectId, issueId, updates);
      loadIssues(); // Refresh the list
    } catch (error) {
      console.error('Failed to update issue:', error);
      alert('Failed to update issue. Please try again.');
    }
  };

  const getIssueStatusIcon = (state) => {
    switch (state) {
      case 'opened':
        return <AlertCircle size={16} className="status-open" />;
      case 'closed':
        return <CheckCircle size={16} className="status-closed" />;
      default:
        return <Clock size={16} className="status-pending" />;
    }
  };

  const groupedIssues = {
    todo: issues.filter(issue => issue.state === 'opened' && issue.assignee === null),
    inProgress: issues.filter(issue => issue.state === 'opened' && issue.assignee !== null),
    done: issues.filter(issue => issue.state === 'closed')
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading issues...</p>
      </div>
    );
  }

  return (
    <div className="issue-board">
      {/* Header */}
      {!limit && (
        <div className="issue-board-header">
          <div className="filters">
            <div className="filter-group">
              <Filter size={16} />
              <select 
                value={filters.state} 
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
              >
                <option value="">All States</option>
                <option value="opened">Open</option>
                <option value="closed">Closed</option>
              </select>
              <input
                type="text"
                placeholder="Filter by labels (comma-separated)"
                value={filters.labels}
                onChange={(e) => setFilters(prev => ({ ...prev, labels: e.target.value }))}
              />
            </div>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={16} />
            New Issue
          </button>
        </div>
      )}

      {/* Create Issue Form */}
      {showCreateForm && (
        <div className="create-issue-form">
          <h3>Create New Issue</h3>
          <form onSubmit={handleCreateIssue}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Issue title"
                value={newIssue.title}
                onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Issue description"
                value={newIssue.description}
                onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                rows="4"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Labels (comma-separated)"
                value={newIssue.labels}
                onChange={(e) => setNewIssue(prev => ({ ...prev, labels: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Issue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      {!limit ? (
        <div className="kanban-board">
          <div className="kanban-column">
            <h3>To Do ({groupedIssues.todo.length})</h3>
            <div className="issues-list">
              {groupedIssues.todo.map(issue => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onUpdate={handleUpdateIssue}
                  projectId={projectId}
                />
              ))}
            </div>
          </div>

          <div className="kanban-column">
            <h3>In Progress ({groupedIssues.inProgress.length})</h3>
            <div className="issues-list">
              {groupedIssues.inProgress.map(issue => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onUpdate={handleUpdateIssue}
                  projectId={projectId}
                />
              ))}
            </div>
          </div>

          <div className="kanban-column">
            <h3>Done ({groupedIssues.done.length})</h3>
            <div className="issues-list">
              {groupedIssues.done.map(issue => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onUpdate={handleUpdateIssue}
                  projectId={projectId}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Simple list view for overview
        <div className="issues-list-simple">
          {issues.slice(0, limit).map(issue => (
            <div key={issue.id} className="issue-item-simple">
              <div className="issue-main">
                {getIssueStatusIcon(issue.state)}
                <span className="issue-title">{issue.title}</span>
              </div>
              <div className="issue-meta">
                <span className={`issue-state ${issue.state}`}>
                  {issue.state}
                </span>
                {issue.labels.length > 0 && (
                  <div className="issue-labels">
                    {issue.labels.slice(0, 2).map((label, index) => (
                      <span key={index} className="label-tag">
                        {label}
                      </span>
                    ))}
                    {issue.labels.length > 2 && (
                      <span className="label-more">+{issue.labels.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const IssueCard = ({ issue, onUpdate, projectId }) => {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await gitlabService.addComment(projectId, issue.iid, comment);
      setComment('');
      setShowCommentForm(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleStateChange = (newState) => {
    onUpdate(issue.iid, { state_event: newState });
  };

  return (
    <div className="issue-card">
      <div className="issue-header">
        <span className="issue-id">#{issue.iid}</span>
        <div className="issue-actions">
          <button 
            className="btn-icon"
            onClick={() => setShowCommentForm(!showCommentForm)}
            title="Add comment"
          >
            <MessageSquare size={14} />
          </button>
        </div>
      </div>

      <h4 className="issue-title">{issue.title}</h4>

      {issue.description && (
        <p className="issue-description">
          {issue.description.length > 100 
            ? `${issue.description.substring(0, 100)}...` 
            : issue.description
          }
        </p>
      )}

      {issue.labels.length > 0 && (
        <div className="issue-labels">
          {issue.labels.map((label, index) => (
            <span key={index} className="label-tag">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="issue-footer">
        <div className="issue-meta">
          <span className={`issue-state ${issue.state}`}>
            {issue.state}
          </span>
          {issue.assignee && (
            <span className="issue-assignee">
              @{issue.assignee.username}
            </span>
          )}
        </div>

        {issue.state === 'opened' && (
          <div className="issue-state-actions">
            <button 
              className="btn-success btn-sm"
              onClick={() => handleStateChange('close')}
            >
              Close
            </button>
          </div>
        )}

        {issue.state === 'closed' && (
          <div className="issue-state-actions">
            <button 
              className="btn-secondary btn-sm"
              onClick={() => handleStateChange('reopen')}
            >
              Reopen
            </button>
          </div>
        )}
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="comment-form">
          <form onSubmit={handleAddComment}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows="3"
            />
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCommentForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Add Comment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default IssueBoard;