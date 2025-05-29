import "../styles/sidebar.css";
import { SidebarData } from "./sidebar_data";
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="searchbox">
        <input type="text" placeholder="Search" />
        <SearchTwoToneIcon />
      </div>
      <div className="navigation">
        <ul className="sidebar-list">
          {SidebarData.map((val, key) => {
            const isLearnActiveOnRoot = val.link === "/learn" && window.location.pathname === "/";
            const isActive = window.location.pathname === val.link || isLearnActiveOnRoot;

            return (
              <li
                key={key}
                id={isActive ? "active" : ""}
                className="row"
                onClick={() => {
                  if (val.link === "/learn" && window.location.pathname === "/") {
                    navigate("/learn");
                  } else {
                    navigate(val.link);
                  }
                }}
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