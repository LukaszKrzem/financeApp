import { Link } from "react-router-dom";
function Dashboard({ onLogout }) {
  return (
    <>
      <Link to="/">
        <button onClick={onLogout}> wyloguj</button>
      </Link>
    </>
  );
}
export default Dashboard;
