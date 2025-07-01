import { useEffect, useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { BaseUrl } from "../service/Uri";
import { FaCalendarAlt, FaDownload, FaEye, FaUsers } from 'react-icons/fa';
import CommonHeader from './CommonHeader';
import AddVisitorFieldModal from './AddVisitorFieldModal';
import { MdDashboardCustomize } from "react-icons/md";

const Visitors = ({ toggleSidebar, setCurrentPage ,isOpen}) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPages] = useState(1);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showDeletedFields, setShowDeletedFields] = useState(false);
  const [activeFields, setActiveFields] = useState([]);
  const itemsPerPage = 6;
  const company = JSON.parse(localStorage.getItem('company'));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 992);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

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

  const fetchActiveFields = async () => {
  try {
    const res = await axios.get(`${BaseUrl}/visitor/visitor-fields/form/${company._id}`);
    if (res.data.status === 200) {
      setActiveFields(res.data.data.map(field => field.label));
    }
  } catch (err) {
    console.error("Error fetching active visitor fields:", err);
  }
};

  useEffect(() => {
    fetchVisitors();
    fetchActiveFields();
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

  // 🔑 Get all unique dynamic field keys
  const dynamicFieldKeys = Array.from(
  new Set(
    visitors.flatMap(v => v.fields ? Object.keys(v.fields) : [])
  )
).filter(k => showDeletedFields || activeFields.includes(k)); // 👈 filter applied here

  // 📁 Download CSV with dynamic fields
  const downloadCSV = () => {
    const headers = [...dynamicFieldKeys, 'Date', 'Time'];
    const rows = filteredVisitors.map(v => [
      ...dynamicFieldKeys.map(k => v.fields?.[k] || ''),
      new Date(v.createdAt).toLocaleDateString(),
      new Date(v.createdAt).toLocaleTimeString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "visitors.csv");
  };

  return (
    <div className="container-fluid p-0">
      <CommonHeader title="Visitors" company={company} toggleSidebar={toggleSidebar} setCurrentPage={setCurrentPage} />

      <div className="card border-0 shadow-sm my-4" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <div className="card-body p-4 d-sm-flex justify-content-between align-items-center">
          <div>
            <h3 className="text-white mb-1 fw-bold"><FaUsers className="me-2" />Visitors Management</h3>
            <p className="text-white-50 mb-0">Track and manage your visitors efficiently</p>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3 mt-sm-0">
            {/* <button className="btn btn-light fw-medium px-4 py-2 shadow-sm" onClick={() => setShowFieldModal(true)} style={{ borderRadius: '15px' }}>
              <MdDashboardCustomize className='mb-1'/> Customize Form
            </button> */}
            <button className="btn btn-light fw-medium px-4 py-2 shadow-sm" onClick={downloadCSV} style={{ borderRadius: '15px' }}><FaDownload className="me-2" /> Download CSV</button>
          </div>
        </div>
      </div>

      <AddVisitorFieldModal show={showFieldModal} onClose={() => setShowFieldModal(false)} />

      {/* Date Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3 text-muted"><FaCalendarAlt className="me-2" />Filter by Date Range</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium text-muted">From Date</label>
              <input
                type="date"
                className="form-control shadow-sm"
                value={dateRange.from}
                onChange={e => { setDateRange({ ...dateRange, from: e.target.value }); setCurrentPages(1); }}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium text-muted">To Date</label>
              <input
                type="date"
                className="form-control shadow-sm"
                value={dateRange.to}
                onChange={e => { setDateRange({ ...dateRange, to: e.target.value }); setCurrentPages(1); }}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="card border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Loading visitors...</p>
            </div>
          ) : (
            <div className="table-responsive ca_visitor" style={{ maxWidth: isMobile ? 'calc(100vw - 32px)' : isOpen ? 'calc(100vw - 312px)' : 'calc(100vw - 123px)', overflowX: 'scroll',}}>
              {/* <div className="d-flex justify-content-between align-items-center p-3">
                <div className="form-check form-switch ms-3 ms-auto rounded-2 py-2 ps-5 pe-2" style={{ background: 'linear-gradient(135deg, rgb(240, 147, 251) 0%, rgb(245, 87, 108) 100%)' }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showDeletedFields"
                    checked={showDeletedFields}
                    onChange={() => setShowDeletedFields(!showDeletedFields)}
                  />
                  <label className="form-check-label text-white fw-semibold" htmlFor="showDeletedFields">
                    Show Deleted Fields
                  </label>
                </div>
              </div> */}

              <table className="table table-hover mb-0">
                <thead style={{ background: 'linear-gradient(45deg, #f8f9ff, #e3f2fd)' }}>
                  <tr>
                    {dynamicFieldKeys.map((key, i) => (
                      <th key={i} className={`fw-bold px-3 py-3 ${activeFields.includes(key) ? 'text-primary' : 'text-secondary'}`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                    {dynamicFieldKeys.some(k => showDeletedFields || activeFields.includes(k)) && (
                    <th className="fw-bold text-primary px-3 py-3 text-end" style={{minWidth:"210px"}}>Date/Time</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentVisitors.map((v, index) => !Object.keys(v.fields || {}).some(k => showDeletedFields || dynamicFieldKeys.includes(k)) ? '' : (
                    
                    <tr key={index} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      {dynamicFieldKeys.map((key, idx) => {
                        const val = v.fields?.[key];
                        const isImage = typeof val === "string" && val.startsWith("uploads/visitor-images/");
                        return (
                          <td key={idx} className={`py-3 px-3 ${activeFields.includes(key) ? 'text-dark' : 'text-secondary'}`}>
                            {isImage ? (
                              <img src={`${BaseUrl}/${val}`} alt="Visitor" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}/>
                            ) : (
                              val || <span className="text-muted">—</span>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="py-3 px-3 text-end">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVisitors.length >= itemsPerPage && activeFields.length > 0 && (
                <div className="d-flex justify-content-center align-items-center py-4">
                  <button className="btn btn-outline-primary me-2" onClick={() => setCurrentPages(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    Prev
                  </button>
                  <span className="fw-bold mx-2">Page {currentPage} of {totalPages}</span>
                  <button className="btn btn-outline-primary ms-2" onClick={() => setCurrentPages(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
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

export default Visitors;
