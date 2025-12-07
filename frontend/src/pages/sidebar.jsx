import "../styles/sidebar.css";
import { SidebarData } from "./sidebar_data";
import { useNavigate } from 'react-router-dom';
import api from "../api";
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import LogoutIcon from '@mui/icons-material/Logout';

function Sidebar({ searchQuery, onSearch, tutorialStep }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleGenericShell = async () => {
    console.log("Starting generic shell session...");
    try {
      const response = await api.post('/api/labs/start/', {});
      if (response.status === 201 && response.data.session_id) {
        const sessionId = response.data.session_id;
        navigate(`/shell/${sessionId}`);
      }
    } catch (err) {
      console.error("Failed to start generic shell session:", err);
      alert("Could not start a generic shell. Please try again.");
    }
  };

  return (
    <div className="sidebar" style={tutorialStep > 0 ? { zIndex: 1001 } : {}}>
      <div className={`searchbox ${tutorialStep === 1 ? 'highlight-element' : ''}`}>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
        <SearchTwoToneIcon />
      </div>
      <div className="navigation">
        <ul className="sidebar-list">
          {SidebarData.map((val, key) => {
            const isLearnActiveOnRoot = val.link === "/learn" && window.location.pathname === "/";
            const isActive = window.location.pathname === val.link || isLearnActiveOnRoot;

            let isHighlighted = false;
            if (tutorialStep === 2 && val.title === "Learn") isHighlighted = true;
            if (tutorialStep === 4 && val.title === "Terminal") isHighlighted = true;

            const clickHandler = val.title === "Terminal"
              ? handleGenericShell
              : () => navigate(val.link);

            return (
              <li
                key={key}
                id={isActive ? "active" : ""}
                className={`row ${isHighlighted ? 'highlight-element' : ''}`}
                onClick={clickHandler}
              >
                <div id="icon">{val.icon}</div>
                <div id="title">{val.title}</div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="logout">
        <ul className="sidebar-list">
          <li className="row" onClick={handleLogout}>
            <div id="icon"><LogoutIcon /></div>
            <div id="title">Logout</div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;