import TerminalComponent from "./terminalcomponent";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import "../styles/shell.css";
import { useNavigate } from 'react-router-dom';

function Shell() {
  const handleAddTab = () => {
    console.log("Add new tab clicked!");
    // Future: logic to add a new terminal instance/tab
  };

  const handleCloseTab = (tabId) => {
    console.log(`Close tab clicked for: ${tabId}`);
    // Future: logic to close the specified tab
  };

  const navigate = useNavigate();
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
          <TerminalComponent />
        </div>
      </div>
    </div>
  );
}

export default Shell;