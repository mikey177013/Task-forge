import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { Gitlab, AlertCircle, CheckCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(token);
      if (result.success) {
        login(result.user, token);
      } else {
        setError('Authentication failed. Please check your token.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authenticate with GitLab');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Gitlab size={48} className="login-icon" />
          <h1>TaskForge</h1>
          <p>Connect your GitLab account to get started</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="token">GitLab Personal Access Token</label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your GitLab Personal Access Token"
              required
              disabled={loading}
            />
            <div className="help-text">
              <CheckCircle size={16} />
              Create a token with <strong>read_api</strong>, <strong>read_repository</strong>, and <strong>write_repository</strong> scopes
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={loading || !token.trim()}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Connecting...
              </>
            ) : (
              <>
                <Gitlab size={20} />
                Connect to GitLab
              </>
            )}
          </button>
        </form>

        <div className="login-help">
          <h3>How to get your Personal Access Token:</h3>
          <ol>
            <li>Go to your GitLab Settings</li>
            <li>Navigate to "Access Tokens"</li>
            <li>Create a new token with the required scopes</li>
            <li>Copy the token and paste it above</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Login;