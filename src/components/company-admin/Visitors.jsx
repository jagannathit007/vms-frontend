import { useEffect, useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import {BaseUrl} from "../service/Uri"
import { FaCalendarAlt, FaDownload, FaEye, FaUsers } from 'react-icons/fa';
import CommonHeader from './CommonHeader';

const Visitors = ({ toggleSidebar, setCurrentPage }) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPages] = useState(1);
const itemsPerPage = 6;
const company = JSON.parse(localStorage.getItem('company'));



  const fetchVisitors = async () => {
    try {
      const token = localStorage.getItem('companyToken');
      const res = await axios.get(`${BaseUrl}/visitor/company-visitor`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 200) {
        setVisitors(res.data.data);
      } else {
        console.error("Failed to fetch visitors:", res.data.message);
      }
    } catch (error) {
      console.error("Error fetching visitors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const filteredVisitors = visitors.filter(v => {
    const visitDate = new Date(v.createdAt);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    return (!dateRange.from || visitDate >= fromDate) &&
           (!dateRange.to || visitDate <= toDate);
  });
  const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentVisitors = filteredVisitors.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  const downloadCSV = () => {
    const headers = ['Name', 'Mobile', 'Purpose', 'Date', 'Time'];
    const rows = filteredVisitors.map(v => [
      v.name,
      v.number,
      v.purpose,
      new Date(v.createdAt).toLocaleDateString(),
      new Date(v.createdAt).toLocaleTimeString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "visitors.csv");
  };

  return (
    <div className="container-fluid p-0">
      <CommonHeader 
        title="Visitors" 
        company={company} 
        toggleSidebar={toggleSidebar} 
        setCurrentPage={setCurrentPage} 
      />
      {/* Header Section */}
      <div className="card border-0 shadow-sm my-4" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <div className="card-body p-4">
          <div className="d-sm-flex justify-content-between align-items-center">
            <div>
              <h3 className="text-white mb-1 fw-bold">
                <FaUsers className="me-2" />
                Visitors Management
              </h3>
              <p className="text-white-50 mb-0">Track and manage your visitors efficiently</p>
            </div>
            <button 
              className="btn btn-light fw-medium px-4 py-2 shadow-sm mt-4 mt-sm-0" 
              onClick={downloadCSV}
              style={{ borderRadius: '15px' }}
            >
              <FaDownload className="me-2" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3 text-muted">
            <FaCalendarAlt className="me-2" />
            Filter by Date Range
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium text-muted">From Date</label>
              <input
                type="date"
                className="form-control shadow-sm"
                value={dateRange.from}
                onChange={e => {setDateRange({ ...dateRange, from: e.target.value }); setCurrentPages(1);}}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium text-muted">To Date</label>
              <input
                type="date"
                className="form-control shadow-sm"
                value={dateRange.to}
                onChange={e => {setDateRange({ ...dateRange, to: e.target.value }); setCurrentPages(1);}}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading visitors...</p>
            </div>
          ) : (
            <div className="table-responsive ca_visitor">
              <table className="table table-hover mb-0">
                <thead style={{ background: 'linear-gradient(45deg, #f8f9ff, #e3f2fd)' }}>
                  <tr>
                    <th className="fw-bold text-primary px-4 py-3" style={{ borderRadius: '12px 0 0 0' }}>Name</th>
                    <th className="fw-bold text-primary py-3">Mobile</th>
                    <th className="fw-bold text-primary py-3">Purpose</th>
                    <th className="fw-bold text-primary py-3 text-end" style={{ borderRadius: '0 12px 0 0' }}>Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVisitors.map((v, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '35px', height: '35px' }}>
                            <span className="text-white fw-bold">{v.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="fw-medium">{v.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-light text-dark px-3 py-2">{v.number}</span>
                      </td>
                      <td className="py-3">{v.purpose}</td>
                      <td className="py-3 text-end">{new Date(v.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

{filteredVisitors.length >= itemsPerPage && (
                <div className="d-flex justify-content-center align-items-center py-4">
                <button
                  className="btn btn-outline-primary me-2"
                  onClick={() => setCurrentPages(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                <span className="fw-bold mx-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-outline-primary ms-2"
                  onClick={() => setCurrentPages(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
)}
              {filteredVisitors.length === 0 && (
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

export default Visitors;
