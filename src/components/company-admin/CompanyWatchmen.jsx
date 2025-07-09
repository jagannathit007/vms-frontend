import React from 'react'
import CommonHeader from './CommonHeader';
import axios from 'axios';
import Swal from 'sweetalert2';
import { BaseUrl } from '../service/Uri';
import { useState } from 'react';
import { useEffect } from 'react';

const CompanyWatchmen = ({setCurrentPage,toggleSidebar,isOpen}) => {
   const CompanyInfo = JSON.parse(localStorage.getItem('company'));
  const token = localStorage.getItem('companyToken');
  const [watchmen, setWatchmen] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', password: '', _id: null });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchWatchmen = async () => {
    try {
      const res = await axios.get(`${BaseUrl}/watchmen/company/${CompanyInfo._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWatchmen(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch entry points:", error);
    }
  };

  useEffect(() => {
    fetchWatchmen();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (entry = null) => {
    if (entry) {
      setFormData(entry);
    } else {
      setFormData({ name: '', mobile: '', password: '', _id: null });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.mobile || !formData.password) {
        Toast.fire({ icon: 'error', title: 'All fields are required' });
        return;
      }

      if (formData._id) {
        const res = await axios.put(`${BaseUrl}/watchmen/update/${formData._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res?.data?.data) {
          Toast.fire({ icon: 'error', title: res?.data?.message || 'Update failed!' });
          return;
        }

        Toast.fire({ icon: 'success', title: res.data.message });
      } else {
        const res = await axios.post(`${BaseUrl}/watchmen/create`, {
          ...formData,
          companyId: CompanyInfo._id,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res?.data?.data) {
          Toast.fire({ icon: 'error', title: res?.data?.message || 'Create failed!' });
          return;
        }

        Toast.fire({ icon: 'success', title: res.data.message });
      }

      setShowModal(false);
      fetchWatchmen();
    } catch (error) {
      Toast.fire({ icon: 'error', title: error?.response?.data?.message || 'Something went wrong!' });
    }
  };

  const deleteEntryPoint = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the entry point!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(`${BaseUrl}/watchmen/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchWatchmen();
        Toast.fire({ icon: 'success', title: res?.data?.message || 'Entry Point deleted successfully!' });
      } catch (error) {
        console.error("Delete failed:", error);
        Toast.fire({ icon: 'error', title: 'Failed to delete entry point' });
      }
    }
  };
  return (
    <div className="container-fluid p-0">
      <CommonHeader title="Watchmen" company={CompanyInfo} toggleSidebar={toggleSidebar} setCurrentPage={setCurrentPage} />

      <div className="container-fluid px-0 py-4">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center bg-white p-3">
              <div className="mb-3 mb-sm-0">
                <h4 className="mb-1 text-dark fw-bold">Company Entry Points</h4>
                <p className="text-muted mb-0">Manage your security/entry staff</p>
              </div>
              <button 
                className="btn btn-primary px-4 py-2 d-flex align-items-center ms-auto"
                onClick={() => openModal()}
              >
                <i className="fas fa-plus me-2"></i>
                <span className="">Add Entry</span>
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="ca_visitor" style={{ maxWidth: isMobile ? 'calc(100vw - 32px)' : isOpen ? 'calc(100vw - 312px)' : 'calc(100vw - 102px)', overflowX: 'scroll' }}>
                  <table className="table table-hover mb-0 overflow-scroll modern-table">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 py-3 px-3 fw-semibold text-dark" style={{minWidth:"250px"}}>Name</th>
                        <th className="border-0 py-3 px-3 fw-semibold text-dark" style={{minWidth:"200px"}}>Mobile</th>
                        <th className="border-0 py-3 px-3 fw-semibold text-dark" style={{minWidth:"140px"}}>Password</th>
                        <th className="border-0 py-3 px-3 fw-semibold text-dark text-center" style={{width:"150px"}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchmen.map((entry) => (
                        <tr key={entry._id}>
                          <td className="py-3 px-3 border-0">
                            <div className="d-flex align-items-center">
                              <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <span className="text-white fw-bold">{entry.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="fw-medium text-dark">{entry.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 border-0 text-muted">{entry.mobile}</td>
                          <td className="py-3 px-3 border-0">
                            <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                              {'*'.repeat(entry.password.length)}
                            </span>
                          </td>
                          <td className="py-3 px-3 border-0 text-center">
                            <div className="btn-group" role="group">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openModal(entry)}
                              >
                                <i className="fas fa-edit me-1"></i>Edit
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteEntryPoint(entry._id)}
                              >
                                <i className="fas fa-trash me-1"></i>Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {watchmen.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-5 text-muted">
                            <i className="fas fa-user-shield fa-3x mb-3 text-light"></i>
                            <p className="mb-0">No entry points found. Add your first watchman!</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-0 pb-2">
                <div>
                  <h5 className="modal-title fw-bold text-dark ">
                    {formData._id ? 'Update Entry Point' : 'Add New Entry'}
                  </h5>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label text-dark fw-medium">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control border-light" 
                    name="name" 
                    placeholder="Enter name" 
                    value={formData.name} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-dark fw-medium">Mobile Number</label>
                  <input 
                    type="text" 
                    className="form-control border-light" 
                    name="mobile" 
                    placeholder="Enter mobile number" 
                    value={formData.mobile} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-dark fw-medium">Password</label>
                  <input 
                    type="text" 
                    className="form-control border-light" 
                    name="password" 
                    placeholder="Enter password" 
                    value={formData.password} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-light px-4" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary px-4" onClick={handleSubmit}>
                  <i className="fas fa-save me-2"></i>{formData._id ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyWatchmen
