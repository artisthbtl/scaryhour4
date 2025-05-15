import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant"
import api from "../api"
import "../App.css"

function PasswordForm() {
  const [password, setPassword] = useState("")
	const [passwordConf, setPasswordConf] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

	return (
		<div className="wrapper" align="center">
			<form>
				<h1>Register</h1>
				<div className="inputbox">
					<input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
				</div>

				<div className="inputbox">
					<input type="password" placeholder="Password" onChange={(e) => setPasswordConf(e.target.value)} required />
				</div>

				<button type="submit" className="submitBtn">Submit</button>

				<div className="registerLink">
					<a href="./login">Login Here</a>
				</div>
			</form>
		</div>
  );
}

export default PasswordForm