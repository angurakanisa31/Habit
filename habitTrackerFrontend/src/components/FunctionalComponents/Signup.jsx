import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import axios from 'axios';
const Signup = (props) => {
  
  const [firstName, setFirstname] = useState("");
  const [lastName, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async(event) => {
    event.preventDefault();
    console.log("Event Triggered");
    try{
      const req=await axios.post("https://habit-t6bn.onrender.com/signup",{
        firstName:firstName,
        lastName:lastName,
        username:username,
        email:email,
        password:password
      });
      console.log(req);
      alert(req.data);
    }catch(err){
      console.log(err);
    }
    props.onSignup({ firstName, lastName, username, email, password });
    navigate("/Login");
  };

  return (
    <div>
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        Firstname:
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstname(e.target.value)}
        />
        <br />
        Lastname:
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastname(e.target.value)}
        />
        <br />
        Username:
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        Email :
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        Password :
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Signup</button>
      </form>
      Already have an account? <Link to="/Login">Login</Link>
    </div>
  );
};

export default Signup;
