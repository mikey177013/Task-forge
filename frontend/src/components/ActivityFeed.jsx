import React, { useState, useEffect } from 'react';
import { gitlabService } from '../services/api';
import { Activity, GitCommit, GitPullRequest, MessageSquare, AlertCircle, User } from 'lucide-react';
import './ActivityFeed.css';

const ActivityFeed = ({ projectId, limit }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadEvents = async () => {
    try {
      const eventsData = projectId 
        ? await gitlabService.getProjectEvents(projectId)
        : await gitlabService.getUserEvents();
      
      setEvents(limit ? eventsData.slice(0, limit) : eventsData);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (action) => {
    switch (action) {
      case 'pushed to':
      case 'pushed new':
        return <GitCommit size={16} />;
      case 'opened':
      case 'closed':
      case 'merged':
        return <GitPullRequest size={16} />;
      case 'commented on':
        return <MessageSquare size={16} />;
      case 'created':
        return <AlertCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getEventColor = (action) => {
    switch (action) {
      case 'pushed to':
      case 'pushed new':
        return 'var(--success-color)';
      case 'opened':
        return 'var(--info-color)';
      case 'closed':
        return 'var(--error-color)';
      case 'merged':
        return 'var(--primary-color)';
      case 'commented on':
        return 'var(--warning-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const formatEventText = (event) => {
    const action = event.action_name;
    const target = event.target_type?.toLowerCase() || 'item';
    
    switch (action) {
      case 'pushed to':
        return `pushed to ${event.push_data?.ref || 'repository'}`;
      case 'pushed new':
        return `created new branch ${event.push_data?.ref || ''}`;
      case 'opened':
        return `opened ${target} "${event.target_title || ''}"`;
      case 'closed':
        return `closed ${target} "${event.target_title || ''}"`;
      case 'merged':
        return `merged ${target} "${event.target_title || ''}"`;
      case 'commented on':
        return `commented on ${target} "${event.target_title || ''}"`;
      case 'created':
        return `created ${target} "${event.target_title || ''}"`;
      default:
        return `${action} ${target}`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading activity...</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {!limit && (
        <div className="activity-header">
          <div className="activity-title">
            <Activity size={20} />
            <h3>Recent Activity</h3>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={loadEvents}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <Activity size={32} />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <div key={event.id} className="event-item">
              <div className="event-icon" style={{ color: getEventColor(event.action_name) }}>
                {getEventIcon(event.action_name)}
              </div>
              
              <div className="event-content">
                <div className="event-text">
                  <strong>{event.author?.name || 'Unknown user'}</strong>{' '}
                  {formatEventText(event)}
                </div>
                
                <div className="event-meta">
                  <span className="event-time">
                    {new Date(event.created_at).toLocaleDateString()} at{' '}
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                  
                  {event.author?.username && (
                    <span className="event-username">
                      <User size={12} />
                      @{event.author.username}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!limit && events.length > 0 && (
        <div className="activity-footer">
          <div className="auto-refresh-notice">
            <RefreshCw size={12} />
            <span>Auto-refreshes every 30 seconds</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;