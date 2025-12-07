import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant";
import api from "../api";
import "../styles/App.css"
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

function PasswordForm({ username, firstName, lastName }) {
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [visible, setVisible] = useState(false);
  const [visibleConf, setVisibleConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConf) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/user/register/", {
        username,
        first_name: firstName,
        last_name: lastName,
        password,
      });

      try {
        const res = await api.post("/api/token/new/", {
          username,
          password,
        });
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        localStorage.setItem("showTutorial", "true"); 

        navigate("/learn");
      } catch (err) {
        alert(err.response?.data?.detail || "Login failed");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagecenter">
      <div className="wrapper" align="center">
        <form onSubmit={handleSubmit}>
          <h1>Create Password</h1>
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

          <div className="inputbox password-box">
            <input
              type={visibleConf ? "text" : "password"}
              placeholder="Confirm Password"
              onChange={(e) => setPasswordConf(e.target.value)}
              required
            />
            <span onClick={() => setVisibleConf(!visibleConf)} className="icon">
              {visibleConf ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            </span>
          </div>

          <button type="submit" className="submitBtn" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasswordForm