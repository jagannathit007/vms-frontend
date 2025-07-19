import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaPhone, FaExclamationTriangle, FaPhoneAlt } from 'react-icons/fa';
import { BaseUrl } from "../service/Uri";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../style/CompanyLogin.css';
import { GiPoliceOfficerHead } from "react-icons/gi";

const WatchmenLogin = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await axios.post(`${BaseUrl}/watchmen/signin`, {
        mobile,
        password
      });
      const result = response.data;

      if (result.data) {
        localStorage.setItem('watchmenToken', result.data.token);
        localStorage.setItem('watchmen', JSON.stringify(result.data.company));
        setErrorMsg('');
        navigate('/watchmen');
      } else {
        setErrorMsg(result.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center p-4">
      <div className="login-overlay"></div>
      <div className="float-blob blob1"></div>
      <div className="float-blob blob2"></div>
      <div className="login-card position-relative">
        <div className="login-header text-white text-center py-4 px-4">
          <div className="mb-3">
            <div className="header-icon">
              <GiPoliceOfficerHead  size={28} className="text-white" />
            </div>
          </div>
          <h3 className="mb-1 fw-bold">Watchmen Portal</h3>
          <p className="mb-0 opacity-75">Sign in to access your panel</p>
          <div className="header-wave"></div>
        </div>

        <div className="p-5 company_form">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-dark mb-2">Mobile Number</label>
              <div className="custom-input-group input-group">
                <span className="input-group-text text-primary px-3"><FaPhoneAlt size={18} /></span>
                <input
                  type="tel"
                  className="form-control bg-transparent"
                  placeholder="Enter your 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\D/g, '');
                    if (input.length <= 10) setMobile(input);
                  }}
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit mobile number"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-dark mb-2">Password</label>
              <div className="custom-input-group input-group">
                <span className="input-group-text text-primary px-3"><FaLock size={18} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control bg-transparent"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="btn bg-transparent border-0 text-muted px-3"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="error-alert alert d-flex align-items-center">
                <FaExclamationTriangle className="me-2" size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="d-grid">
              <button type="submit" className="login-btn btn btn-lg text-white fw-semibold py-3" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="me-2" />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted small mb-0">Secure access for watchmen only</p>
          </div>
        </div>

        <div className="decorative-circle top-right"></div>
        <div className="decorative-circle bottom-left"></div>
      </div>
    </div>
  );
};

export default WatchmenLogin;
