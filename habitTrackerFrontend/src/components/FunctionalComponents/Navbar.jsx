import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav>
      <ul>
        <li><Link to='/' className="link">Signup</Link></li>
        <li><Link to='/Login' className="link">Login</Link></li>
        <li><Link to='/AddHabit' className="link">AddHabit</Link></li>
        <li><Link to='/HabitTracker' className="link">HabitTracker</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
