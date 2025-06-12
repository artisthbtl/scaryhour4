import React from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // 1. Import useParams
import TerminalComponent from "./terminalcomponent";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import "../styles/shell.css";

function Shell() {
    const { sessionId } = useParams();

    const navigate = useNavigate();

    const handleAddTab = () => {
        console.log("Add new tab clicked!");
    };

    const handleCloseTab = (tabId) => {
        console.log(`Close tab clicked for: ${tabId}`);
    };

    const handleCloseWindow = () => {
        navigate('/learn');
    };

    return (
        <div className="terminal-window-frame">
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