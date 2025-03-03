import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import "./NavBar.css";

const Navbar = () => {
  const { logoutUser, user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="navBar">
      <ul>
        {/* Brand / Home Link */}
        <li className="brand">
          <Link to="/" style={{ textDecoration: "none", color: "white" }}>
            <b>IT LOGIN</b>
          </Link>
        </li>

        {/* Navigation Links */}
        <li>
          <a href="http://10.10.10.1:8000/admin/" className="btn btn-light">
            Django Database
          </a>
        </li>
        <li>
          <a href="http://10.10.10.1/archive.html" className="btn btn-dark">
            View Archived Tickets
          </a>
        </li>
        <li>
          <a href="http://10.10.10.1/charts.html" className="btn btn-primary">
            View Charts
          </a>
        </li>
        <li>
          <a href="http://10.10.10.1/kanban.html" className="btn btn-primary">
            View Kanban Board
          </a>
        </li>

        {/* Authentication Buttons */}
        <li>
          {user ? (
            <button onClick={logoutUser}>Logout</button>
          ) : (
            <button onClick={() => navigate("/login")}>Login</button>
          )}
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
