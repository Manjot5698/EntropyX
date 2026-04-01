import { useEffect, useState, useRef, createContext, useContext, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        
        try {
          const response = await axios.post(
            `${API}/auth/session`,
            { session_id: sessionId },
            { withCredentials: true }
          );
          
          setUser(response.data);
          navigate('/dashboard', { replace: true, state: { user: response.data } });
        } catch (error) {
          console.error("Auth callback error:", error);
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#A1A1AA] font-mono text-sm">Authenticating...</p>
      </div>
    </div>
  );
};

// App Router Component
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-[#050505]">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0A0B10',
                border: '1px solid #1E2028',
                color: '#FFFFFF',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
export { API };
