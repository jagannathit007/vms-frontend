import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaCheckCircle, FaDoorOpen, FaDownload, FaEye, FaPaperPlane, FaSignOutAlt, FaUsers } from 'react-icons/fa';
import { BaseUrl } from '../service/Uri';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';

const WatchmenDashboard = () => {
  const [company, setCompany] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFields, setActiveFields] = useState([]);
  const [showDeletedFields, setShowDeletedFields] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const itemsPerPage = 6;
  const navigate = useNavigate();
  const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedCompany = JSON.parse(localStorage.getItem('watchmen'));
    if (!storedCompany) {
      navigate('/watchmen/login');
    } else {
      setCompany(storedCompany);
      fetchVisitors(storedCompany.companyId._id);
      fetchActiveFields(storedCompany.companyId._id);
    }
  }, [navigate]);

  const fetchVisitors = async (companyId) => {
    try {
      const token = localStorage.getItem('watchmenToken');
      const res = await axios.get(`${BaseUrl}/visitor/watchmen/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 200) {
        setVisitors(res.data.data || []);
      } else {
        Toast.fire({
          icon: 'error',
          title: 'Fetch Visitors Failed',
          text: res.data.message || 'Failed to fetch visitors.',
        });
      }
    } catch (err) {
      console.error("Error fetching visitors:", err);
      Toast.fire({
        icon: 'error',
        title: 'Fetch Visitors Failed',
        text: err.response?.data?.error || 'Error fetching visitors.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveFields = async (companyId) => {
    try {
      const res = await axios.get(`${BaseUrl}/visitor/visitor-fields/form/${companyId}`);
      if (res.data.status === 200) {
        setActiveFields(res.data.data.map(field => field.label));
      }
    } catch (err) {
      console.error("Error fetching active visitor fields:", err);
      Toast.fire({
        icon: 'error',
        title: 'Fetch Fields Failed',
        text: err.response?.data?.error || 'Error fetching visitor fields.',
      });
    }
  };

  const handleCheckOut = async (visitorId) => {
    const result = await Swal.fire({
      title: 'Confirm Check-Out',
      text: 'Are you sure you want to record the exit for this visitor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, check out!',
      cancelButtonText: 'No, cancel',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('watchmenToken');
        const res = await axios.post(`${BaseUrl}/visitor/watchmen/exit/${visitorId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === 200) {
          Toast.fire({
            icon: 'success',
            title: 'Check-Out Successful',
            text: 'Visitor exit recorded successfully!',
          });
          fetchVisitors(company.companyId._id);
        } else {
          Toast.fire({
            icon: 'error',
            title: 'Check-Out Failed',
            text: res.data.message || 'Failed to record visitor exit.',
          });
        }
      } catch (err) {
        console.error("Error checking out visitor:", err);
        Toast.fire({
          icon: 'error',
          title: 'Check-Out Failed',
          text: err.response?.data?.error || 'Error recording visitor exit.',
        });
      }
    }
  };

  const calculateCheckoutMins = (entryTime, exitTime) => {
    if (!exitTime) return '—';
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const diffMs = exit - entry;
    const diffMins = Math.round(diffMs / (1000 * 60));
    return diffMins >= 0 ? `${diffMins} mins` : '—';
  };

  const filteredVisitors = visitors.filter(v => {
    const visitDate = new Date(v.entryTime);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    return (!fromDate || visitDate >= fromDate) && (!toDate || visitDate <= toDate);
  });

  const dynamicFieldKeys = Array.from(
    new Set(visitors.flatMap(v => v.fields ? Object.keys(v.fields) : []))
  ).filter(k => showDeletedFields || activeFields.includes(k));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Confirm Logout',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, log out!',
      cancelButtonText: 'No, cancel',
    });

    if (result.isConfirmed) {
      try {
        localStorage.removeItem('watchmenToken');
        localStorage.removeItem('watchmen');
        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been logged out successfully!',
          timer: 2000,
        });
        navigate('/watchmen/login');
      } catch (err) {
        console.error("Error during logout:", err);
        Swal.fire({
          icon: 'error',
          title: 'Logout Failed',
          text: 'An error occurred while logging out. Please try again.',
        });
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="bg-dark text-white d-flex justify-content-between align-items-center px-3 py-4 px-4 shadow-sm">
        <div className="d-flex align-items-center gap-2">
          <img src={`${BaseUrl}/${company?.companyId?.logo}`} alt="logo image" width="40" height="40"/>
          <h4 className="m-0">{company?.companyId?.name || 'Watchmen Panel'}</h4>
        </div>
        <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
          <FaSignOutAlt className="me-1" /> Logout
        </button>
      </div>

      <div className="card border-0 shadow-sm m-4 " style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <div className="card-body p-4 d-sm-flex justify-content-between align-items-center">
          <div>
            <h3 className="text-white mb-1 fw-bold"><FaUsers className="me-2" />Visitors Management</h3>
            <p className="text-white-50 mb-0">Track and manage your visitors efficiently</p>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3 mt-sm-0">
            <button
              className="btn btn-light fw-medium px-4 py-2 shadow-sm"
              onClick={() => navigate(`/visitor-form/${company?.companyId?._id}`)}
              style={{ borderRadius: '15px' }}
            >
              <FaPaperPlane className="me-2" /> Add Visitor
            </button>
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="card border-0 shadow-sm m-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3 text-muted"><FaCalendarAlt className="me-2" />Filter by Date Range</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium text-muted">From Date</label>
              <input
                type="date"
                className="form-control shadow-sm"
                value={dateRange.from}
                onChange={e => { setDateRange({ ...dateRange, from: e.target.value }); setCurrentPage(1); }}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium text-muted">To Date</label>
              <input
                type="date"
                className="form-control shadow-sm"
                value={dateRange.to}
                onChange={e => { setDateRange({ ...dateRange, to: e.target.value }); setCurrentPage(1); }}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="card border-0 m-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Loading visitors...</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxWidth: isMobile ? 'calc(100vw - 32px)' : 'calc(100vw - 32px)', overflowX: 'scroll' }}>
              <table className="table table-hover mb-0">
                <thead style={{ background: 'linear-gradient(45deg, #f8f9ff, #e3f2fd)' }}>
                  <tr>
                    {dynamicFieldKeys.map((key, i) => (
                      <th key={i} className={`fw-bold px-3 py-3 ${activeFields.includes(key) ? 'text-primary' : 'text-secondary'}`} style={{ minWidth: '130px'}}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                    <th className="fw-bold text-primary px-3 py-3" style={{ minWidth: '130px'}}>Entry Time</th>
                    <th className="fw-bold text-primary px-3 py-3" style={{ minWidth: '130px'}}>Exit Time</th>
                    <th className="fw-bold text-primary px-3 py-3" style={{ minWidth: '110px'}}>Checkout Mins</th>
                    <th className="fw-bold text-primary px-3 py-3" style={{ mINWidth: '100px'}}>Status</th>
                    <th className="fw-bold text-primary px-3 py-3 text-end" style={{ minWidth: '140px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVisitors.map((v, index) => !Object.keys(v.fields || {}).some(k => showDeletedFields || dynamicFieldKeys.includes(k)) ? null : (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      {dynamicFieldKeys.map((key, idx) => {
                        const val = v.fields?.[key];
                        const isImage = typeof val === "string" && val.startsWith("uploads/visitor-images/");
                        return (
                          <td key={idx} className={`py-3 px-3 ${activeFields.includes(key) ? 'text-dark' : 'text-secondary'}`}>
                            {isImage ? (
                              <img src={`${BaseUrl}/${val}`} alt="Visitor" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                            ) : (
                              val || <span className="text-muted">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3">{new Date(v.entryTime).toLocaleString()}</td>
                      <td className="py-3 px-3">{v.exitTime ? new Date(v.exitTime).toLocaleString() : '—'}</td>
                      <td className="py-3 px-3">{calculateCheckoutMins(v.entryTime, v.exitTime)}</td>
                      <td className="py-3 px-3">{v.status.charAt(0).toUpperCase() + v.status.slice(1)}</td>
                      <td className="py-3 px-3 text-end">
                        {v.status === 'entered' && (
                          <>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCheckOut(v._id)}>
                              <FaDoorOpen className="me-1" /> Check-Out
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVisitors.length >= itemsPerPage && activeFields.length > 0 && (
                <div className="d-flex justify-content-center align-items-center py-4">
                  <button className="btn btn-outline-primary me-2" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    Prev
                  </button>
                  <span className="fw-bold mx-2">Page {currentPage} of {totalPages}</span>
                  <button className="btn btn-outline-primary ms-2" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                    Next
                  </button>
                </div>
              )}

              {(filteredVisitors.length === 0 || !dynamicFieldKeys.some(k => showDeletedFields || activeFields.includes(k))) && (
                <div className="text-center py-5">
                  <FaEye size={48} className="text-muted mb-3" />
                  <p className="text-muted">No visitors found for the selected criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchmenDashboard;