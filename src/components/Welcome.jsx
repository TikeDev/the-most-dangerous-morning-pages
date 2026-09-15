import React from "react";
import WriteButton from "./WriteButton";
import Space from "./Space";
import { Link } from "react-router-dom";

const Welcome = () => (
  <div className="Welcome">
    <Link to="/help" className="navButton helpButton">
      Help
    </Link>
    <Space xl />
    <div>
      <div className="logo">
        <div className="mark"></div>
        <h1>
          <span>The Most</span>
          <span>Dangerous</span>
          <span>Writing App</span>
        </h1>
      </div>
      <Space m />
      <h2>
        Don’t stop typing, or all progress will be lost.
        <i className="caret icon-cursor" />
      </h2>
      <Space xl />
      <div className="welcome-actions"><WriteButton ghost color="red" /><Link className="morning-link" to="/write?morning=true&type=words&limit=750">Start Morning Pages <span>750 words</span></Link></div>
    </div>
    <div className="accolades" />
  </div>
);

export default Welcome;
