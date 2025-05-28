import "../styles/sidebar.css"
import { SidebarData } from "./sidebar_data"
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import LogoutIcon from '@mui/icons-material/Logout';

function Sidebar (){    
	return (
    <div className="sidebar">
      {/* <h1 align="center">Hi, username</h1> */}
      <div className="searchbox">
        <input type="text" placeholder="Search" />
        <SearchTwoToneIcon/>
      </div>
      <div className="navigation">
        <ul className="sidebar-list">
          {SidebarData.map ((val, key) => {
            return (
              <li key={key}
              id={window.location.pathname === val.link ? "active" : ""}
              className="row"
              onClick={() => {window.location.pathname = val.link}}>
                <div id="icon">{val.icon}</div>
                <div id="title">{val.title}</div>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="logout">
        <ul className="sidebar-list">
          <li class="row">
            <div id="icon"><LogoutIcon/></div>
            <div id="title">Logout</div>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar