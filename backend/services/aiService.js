const axios = require('axios');

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async generateProjectSummary(projectData) {
    if (!this.openaiApiKey) {
      return this.generateFallbackSummary(projectData);
    }

    try {
      const prompt = this.buildProjectSummaryPrompt(projectData);
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful project management assistant. Provide concise, informative summaries of GitLab project activity.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateFallbackSummary(projectData);
    }
  }

  async generateWeeklySummary(events) {
    if (!this.openaiApiKey) {
      return this.generateFallbackWeeklySummary(events);
    }

    try {
      const prompt = this.buildWeeklySummaryPrompt(events);
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful development activity summarizer. Provide a concise weekly summary of GitLab activities.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateFallbackWeeklySummary(events);
    }
  }

  buildProjectSummaryPrompt(projectData) {
    const { issues, mergeRequests, pipelines, events } = projectData;
    
    return `
    Please provide a concise project summary based on this GitLab data:

    Issues:
    - Total: ${issues.length}
    - Open: ${issues.filter(i => i.state === 'opened').length}
    - Closed: ${issues.filter(i => i.state === 'closed').length}

    Merge Requests:
    - Total: ${mergeRequests.length}
    - Open: ${mergeRequests.filter(mr => mr.state === 'opened').length}
    - Merged: ${mergeRequests.filter(mr => mr.state === 'merged').length}

    Recent Pipelines: ${pipelines.slice(0, 3).map(p => `${p.status} (${p.ref})`).join(', ')}

    Please provide a 2-3 sentence summary highlighting the key project status and recent activity.
    `;
  }

  buildWeeklySummaryPrompt(events) {
    const eventTypes = events.reduce((acc, event) => {
      acc[event.action_name] = (acc[event.action_name] || 0) + 1;
      return acc;
    }, {});

    return `
    Please provide a weekly development summary based on these GitLab activities:

    Activity Breakdown:
    ${Object.entries(eventTypes).map(([action, count]) => `- ${action}: ${count}`).join('\n')}

    Total Events: ${events.length}

    Please provide a 2-3 sentence summary of the week's development activity highlights.
    `;
  }

  generateFallbackSummary(projectData) {
    const { issues, mergeRequests, pipelines } = projectData;
    
    const openIssues = issues.filter(i => i.state === 'opened').length;
    const openMRs = mergeRequests.filter(mr => mr.state === 'opened').length;
    const recentPipelineStatus = pipelines[0]?.status || 'unknown';

    return `Project Summary: ${openIssues} open issues, ${openMRs} open merge requests. Latest pipeline: ${recentPipelineStatus}.`;
  }

  generateFallbackWeeklySummary(events) {
    const commitCount = events.filter(e => e.action_name === 'pushed to').length;
    const mrCount = events.filter(e => e.action_name.includes('merge request')).length;
    const issueCount = events.filter(e => e.action_name.includes('issue')).length;

    return `Weekly Summary: ${commitCount} commits, ${mrCount} merge request activities, ${issueCount} issue activities. Total events: ${events.length}.`;
  }
}

module.exports = new AIService();