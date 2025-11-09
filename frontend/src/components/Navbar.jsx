import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Gitlab, LogOut, User, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <Gitlab size={24} />
          <span>TaskForge</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Projects
          </Link>
          {user && (
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          <div className="user-info">
            <User size={16} />
            <span>{user?.username}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="btn-logout"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link 
            to="/" 
            className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Projects
          </Link>
          {user && (
            <Link 
              to="/dashboard" 
              className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
          <div className="mobile-user-info">
            <User size={16} />
            <span>Logged in as {user?.username}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="mobile-logout-btn"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;.