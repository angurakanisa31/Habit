import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Login = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async(event) => {
    event.preventDefault();
    console.log("Event Triggered");
    try{
      const req= await axios.post("http://localhost:5000/login",{
        email:email,
         password:password,
      });
      alert(req.data.response);
      if(response.data.isLoggedIn){
        navigate('/AddHabit');
      }
     
    }catch(err){
      console.log(err);
    }
    props.onLogin({ email, password });
    navigate("/AddHabit");
  };

  return (
    <div>
      <h1>Login</h1>
      <form className="container" onSubmit={handleLogin}>
        <div>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <br />
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br />
          <br />
          <button className="button" type="submit">
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
