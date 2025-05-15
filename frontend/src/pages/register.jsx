import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant"
import api from "../api"
import "../App.css"

function Register() {
	const [username, setUsername] = useState("")
	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
	
	return (
		<div className="wrapper" align="center">
			<form>
				<h1>Register</h1>
				<div className="inputbox">
					<input type="text" placeholder="First Name" onChange={(e) => setFirstName(e.target.value)} required />
				</div>

				<div className="inputbox">
					<input type="text" placeholder="Last Name" onChange={(e) => setLastName(e.target.value)} required />
				</div>

				<div className="inputbox">
					<input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
				</div>

				<button type="submit" className="submitBtn">Next</button>

				<div className="registerLink">
					<a href="./login">Login Here</a>
				</div>
			</form>
		</div>
  );
}

export default Register