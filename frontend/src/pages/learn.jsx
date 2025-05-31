import "../styles/App.css"
import Sidebar from "./sidebar"
import LearnPage from "./learnpage"

function Learn() {
  return (
  <div className="learn">
    <Sidebar></Sidebar>
    <LearnPage></LearnPage>
  </div>
  )
}

export default Learn;