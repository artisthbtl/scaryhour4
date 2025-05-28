import { useState } from "react";
import "../styles/App.css"
import PasswordForm from "./password_form";

function Register() {
	const [username, setUsername] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [showPasswordForm, setShowPasswordForm] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault(); // Prevent full page reload
		setShowPasswordForm(true); // Show password form
	};

	// Optionally pass the registration data to the password form
	if (showPasswordForm) {
		return (
			<PasswordForm
				username={username}
				firstName={firstName}
				lastName={lastName}
			/>
		);
	}

	return (
		<div className="pagecenter">
			<div className="wrapper" align="center">
				<form onSubmit={handleSubmit}>
					<h1>Register</h1>

					<div className="inputbox">
						<input
							type="text"
							placeholder="First Name"
							onChange={(e) => setFirstName(e.target.value)}
							required
						/>
					</div>

					<div className="inputbox">
						<input
							type="text"
							placeholder="Last Name"
							onChange={(e) => setLastName(e.target.value)}
							required
						/>
					</div>

					<div className="inputbox">
						<input
							type="text"
							placeholder="Username"
							onChange={(e) => setUsername(e.target.value)}
							required
						/>
					</div>

					<button type="submit" className="submitBtn">
						Next
					</button>

					<div className="registerLink">
						<a href="./login">Login Here</a>
					</div>
				</form>
			</div>
		</div>
	);
}

export default Register;