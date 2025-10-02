import { Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthProvider"; // Changed
import { NavBar } from "./components/NavBar";
import { Container } from "./components/Container";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </AuthProvider>
  );
}
