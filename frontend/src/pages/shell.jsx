import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TerminalComponent from "./terminalcomponent";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api';
import "../styles/shell.css";

const GuideOverlay = ({ steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // const dexterImagePath = '../styles/pixelman.png';

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="guide-overlay">
      <div className="guide-box">
        <div className="guide-content">
					<p className="guide-text">{steps[currentStep].content}</p>
					<button onClick={handleNext} className="guide-next-button">
					{currentStep < steps.length - 1 ? "Next →" : "Start Hacking!"}
					</button>
        </div>
      </div>
    </div>
  );
};


function Shell() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
	console.log("Shell component rendered with sessionId:", sessionId);

  const [guideSteps, setGuideSteps] = useState([]);
  const [isGuiding, setIsGuiding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCloseWindow = () => {
    navigate('/learn');
  };

  if (isLoading) {
    return <div className="loading-screen">Loading Lab Environment...</div>;
  }

  return (
    <div className="terminal-window-frame">
      {isGuiding && guideSteps.length > 0 && (
        <GuideOverlay 
          steps={guideSteps} 
          onComplete={() => setIsGuiding(false)} 
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
          <TerminalComponent sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}

export default Shell;