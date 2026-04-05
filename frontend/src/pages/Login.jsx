import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/index.js';
import { LOGIN } from '../graphql/queries';
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { gsap } from 'gsap';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.login.token);
      onLogin(data.login.user);
    },
    onError: (err) => {
      setError(err.message || 'Login failed. Please try again.');
    }
  });

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(".login-card", 
      { scale: 0.8, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
    );
    tl.fromTo(".login-item", 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    );
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    login({ variables: { username, password } });
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center vh-100 bg-light px-3">
      <div className="login-card card border-0 shadow-lg p-4 p-md-5" style={{ maxWidth: '450px', width: '100%', borderRadius: '24px' }}>
        <div className="text-center mb-4 login-item">
          <div className="bg-primary-subtle d-inline-flex p-3 rounded-circle mb-3">
            <Lock className="text-primary" size={32} />
          </div>
          <h2 className="fw-bold mb-1">PocketPal</h2>
          <p className="text-muted">Sign in to Manage Your Growth</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 small login-item py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2">
            <div className="bg-danger rounded-circle p-1 d-inline-flex" style={{fontSize: '8px', color: 'white'}}>!</div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 login-item">
            <label className="form-label small fw-bold text-muted ps-1">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 ps-3 py-2 text-muted">
                <User size={18} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 py-2" 
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4 login-item">
            <label className="form-label small fw-bold text-muted ps-1">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 ps-3 py-2 text-muted">
                <Lock size={18} />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control border-start-0 border-end-0 py-2" 
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                className="input-group-text bg-white border-start-0 ps-2 pe-3 py-2 text-muted"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                style={{ borderTopRightRadius: '0.375rem', borderBottomRightRadius: '0.375rem' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-3 login-item"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center login-item">
          <p className="small text-muted mb-0">
            Demo Credentials:<br />
            <span className="text-dark fw-medium">admin / admin123</span> (Full Access)<br />
            <span className="text-dark fw-medium">analyst / analyst123</span> (Read Only)<br/>
            <span className="text-dark fw-medium">viewer / viewer123</span> (View Only)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
