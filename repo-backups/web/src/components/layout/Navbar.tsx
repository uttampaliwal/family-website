import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-700 p-4 shadow-lg">
      <ul className="flex justify-center space-x-8 text-lg font-medium">
        <li><Link to="/" className="text-white hover:text-blue-200 transition duration-300">Home</Link></li>
        <li><Link to="/login" className="text-white hover:text-blue-200 transition duration-300">Login</Link></li>
        <li><Link to="/signup" className="text-white hover:text-blue-200 transition duration-300">Signup</Link></li>
        <li><Link to="/about" className="text-white hover:text-blue-200 transition duration-300">About</Link></li>
        <li><Link to="/contact" className="text-white hover:text-blue-200 transition duration-300">Contact</Link></li>
        <li><Link to="/dashboard" className="text-white hover:text-blue-200 transition duration-300">Dashboard</Link></li>
        <li><Link to="/calendar" className="text-white hover:text-blue-200 transition duration-300">Calendar</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
