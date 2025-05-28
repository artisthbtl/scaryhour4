import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant"
import api from "../api"
import "../styles/App.css"
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    setLoading(true)
    e.preventDefault()

    try {
      const res = await api.post("/api/token/new/", {
        username, password
      })
      localStorage.setItem(ACCESS_TOKEN, res.data.access)
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
      navigate("/learn")
    } catch (err) {
      alert(err.response?.data?.detail || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pagecenter">
      <div className="wrapper" align="center">
        <form onSubmit={handleSubmit}>
          <h1>Login</h1>
          <div className="inputbox">
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="inputbox password-box">
          <input
            type={visible ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span onClick={() => setVisible(!visible)} className="icon">
            {visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </span>
          </div>

          <button type="submit" className="submitBtn" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>

          <div className="registerLink">
            <a href="./register">Register Here</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login