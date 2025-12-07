import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/shell.css';
import '../styles/landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="landing-content-wrapper">
        
        <div className="landing-text-section">
          <h1 className="landing-heading">Crack Da Box</h1>
          <p className="landing-subtext">
            Master the command line in a controlled lab.<br/>
            No consequences. Just pure skill. And coffee.
          </p>
          
          <div className="landing-button-group">
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button className="landing-btn landing-btn-primary">Login</button>
            </Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button className="landing-btn landing-btn-secondary">Register</button>
            </Link>
          </div>
        </div>

        <div className="landing-visual-section">
          <div className="terminal-window-frame landing-terminal-frame">
            
            <div className="tab-bar">
              <div className="tab active" style={{ cursor: 'default', background: '#9FE215', color: '#15071A' }}>
                <span>Terminal 1</span>
              </div>
            </div>

            <div className="xterm-outer-container">
              <div className="xterm-inner-container landing-term-content">
                <div>
                  <span className="term-green">hacker:~$</span> ./start_session.sh
                </div>
                <div style={{ color: '#808080', marginTop: '10px' }}>
                  Initializing virtual environment...<br/>
                  Loading kernel modules... [OK]<br/>
                  Connecting to secure server... [OK]
                </div>
                <br/>
                <div>
                  <span className="term-green">hacker:~$</span> cat mission.txt
                </div>
                <div style={{ marginTop: '10px' }}>
                  Target: Level 01 Access<br/>
                  Status: Pending<br/>
                  Objective: Retrieve the hidden flag in the /root directory.
                </div>
                <br/>
                <div>
                  <span className="term-green">hacker:~$</span> <span className="term-cursor"></span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;