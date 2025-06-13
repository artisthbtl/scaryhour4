import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TerminalComponent from "./terminalcomponent";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api';
import "../styles/shell.css";

const GuideOverlay = ({ steps, onComplete, onRedirect }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    const step = steps[currentStep];
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (step.redirect_url) {
        onRedirect(step.redirect_url);
      }
      onComplete(); 
    }
  };

  return (
    <div className="guide-overlay">
      <div className="guide-box">
        <div className="guide-content">
          <p className="guide-text">{steps[currentStep].content}</p>
          <button onClick={handleNext} className="guide-next-button">
            {currentStep < steps.length - 1 ? "Next →" : "Alright!"}
          </button>
        </div>
      </div>
    </div>
  );
};

function Shell() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [guideSteps, setGuideSteps] = useState([]);
  const [isGuiding, setIsGuiding] = useState(true); 
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    if (sessionId) {
      console.log("Fetching guide for session:", sessionId);
      api.get(`/api/labs/session/${sessionId}/guide/`)
        .then(response => {
          setGuideSteps(response.data);
          if (response.data.length === 0) {
            setIsGuiding(false);
          }
        })
        .catch(error => {
          console.error("Failed to fetch guide steps:", error);
          setIsGuiding(false); 
        })
        .finally(() => {
          setIsLoading(false); 
        });
    }
  }, [sessionId]); 


  const handleAddTab = () => {
    console.log("Add new tab clicked!");
  };

  const handleCloseTab = (tabId) => {
    console.log(`Close tab clicked for: ${tabId}`);
  };
  
  const handleRedirect = (url) => {
    navigate(url);
  };

  const handleCloseWindow = () => {
    navigate('/learn');
  };

  if (isLoading) {
    return <div className="loading-screen">Loading Lab Environment...</div>;
  }

  return (
    <div className="terminal-window-frame">
      {isDisconnected && (
        <div className="guide-overlay">
          <div className="guide-box">
            <div className="guide-content">
              <p className="guide-text">Connection to the lab has been lost.</p>
              <button onClick={() => navigate('/learn')} className="guide-next-button">
                Back to Learn Page
              </button>
            </div>
          </div>
        </div>
      )}

      {isGuiding && guideSteps.length > 0 && (
        <GuideOverlay 
          steps={guideSteps} 
          onComplete={() => setIsGuiding(false)}
          onRedirect={handleRedirect}
        />
      )}

      <button 
        className="main-close-button" 
        onClick={handleCloseWindow}
        aria-label="Close terminal window"
      >
        <CloseIcon fontSize="small" />
      </button>

      <div className="tab-bar">
        <div className="tab active">
          <span>Terminal 1</span>
          <button 
            className="close-tab-button" 
            onClick={() => handleCloseTab('Terminal 1')} 
            aria-label="Close tab Terminal 1"
          >
            <CloseIcon fontSize="inherit" />
          </button>
        </div>
        <button className="plus-button" onClick={handleAddTab} aria-label="Add new terminal tab">
          <AddIcon fontSize="small" />
        </button>
      </div>
      <div className="xterm-outer-container">
        <div className="xterm-inner-container">
          <TerminalComponent 
            sessionId={sessionId} 
            setGuideSteps={setGuideSteps}
            setIsGuiding={setIsGuiding}
            setIsDisconnected={setIsDisconnected}
          />
        </div>
      </div>
    </div>
  );
}

export default Shell;