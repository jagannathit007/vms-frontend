import { useState, useEffect } from 'react';
import axios from 'axios';
import { BaseUrl } from '../service/Uri';
import { FaTrash, FaEdit } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AddVisitorFieldModal = ({ show, onClose, companyId }) => {
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fields, setFields] = useState([]);
  const [editId, setEditId] = useState(null);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('adminToken');

  const fetchFields = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BaseUrl}/visitor/visitor-fields?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 200) {
        setFields(res.data.data);
        if (res.data.data.length > 0) {
          const lastPosition = res.data.data[res.data.data.length - 1].position;
          setPosition(lastPosition + 1);
        }else {
          setPosition(1);
        }
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (show) fetchFields();
  }, [show]);

  const hasOtpField = fields.some((field) => field.otpRequired);

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

useEffect(() => {
  if (fieldType === 'number') {
    setOtpRequired(otpRequired || false);
setMinValue(minValue || '');
setMaxValue(maxValue || '');
  }
}, [fieldType]);


const handleAddOrUpdate = async () => {
  if (!label) {
    Toast.fire({ icon: 'error', title: 'Label is required' });
    return;
  }
  if (fieldType === 'number') {
    const min = minValue ? Number(minValue) : undefined;
    const max = maxValue ? Number(maxValue) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      Toast.fire({ icon: 'error', title: 'Min value cannot be greater than Max value.' });
      return;
    }
  }
  const existingOtpField = fields.find(
  (f) => f.otpRequired && f._id !== editId
);

const finalOtpRequired = !!otpRequired && !existingOtpField;

  const payload = {
    companyId,
    label,
    fieldType,
    position: Number(position),
    ...(fieldType === 'number' && {
      validation: {
        min: minValue ? Number(minValue) : undefined,
        max: maxValue ? Number(maxValue) : undefined,
      },
      otpRequired:finalOtpRequired,
    }),
  };

  try {
    let response;
    if (editId) {
      response = await axios.put(`${BaseUrl}/visitor/visitor-fields/${editId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditId(null);
    } else {
      response = await axios.post(`${BaseUrl}/visitor/visitor-fields`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    const { status, message } = response.data;
    if (message === "Label already added") {
      Toast.fire({ icon: 'error', title: message });
      return;
    }
    Toast.fire({icon: 'success',title: editId ? 'Field updated successfully!' : 'Field added successfully!',});
    setLabel('');
    setFieldType('text');
    setOtpRequired(false);
    setMinValue('');
    setMaxValue('');
    fetchFields();

  } catch (error) {
    const msg = error.response?.data?.message || 'An unexpected error occurred';
    Toast.fire({ icon: 'error', title: msg });
    console.error('Error saving field:', error);
  }
};

  const handleDeleteField = async (id) => {
    try {
      await axios.delete(`${BaseUrl}/visitor/visitor-fields/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFields();
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  const handleEdit = (field) => {
    setEditId(field._id);
    setLabel(field.label);
    setFieldType(field.fieldType);
    setMinValue(field.validation?.min || '');
    setMaxValue(field.validation?.max || '');
    setOtpRequired(field.otpRequired || false);
    setPosition(field.position || '');

  };

  const handleClose = () => {
    setLabel('');
    setFields([])
    setFieldType('text');
    setEditId(null);
    setMinValue('');
    setMaxValue('');
    setOtpRequired(false);
    onClose();
    setPosition('');
  };

  if (!show) return null;

  return (
    <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg rounded-3 border-0">
          <div className="modal-header bg-light border-bottom-0">
            <h5 className="modal-title fw-bold">Manage Visitor Form Fields</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body p-4">
            <div className="row g-3 mb-4">
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Position"
                  value={position}
                  min="1"
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Field Label"
                  value={label}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isValid = /^[a-zA-Z0-9\s]*$/.test(value); // ✅ only letters, numbers, space
                    if (isValid) {
                      setLabel(value);
                    } else {
                      Toast.fire({
                        icon: "error",
                        title: "Only letters, numbers and spaces allowed in label",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-md-3">
                <select className="form-select" value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="textarea">Long Text</option>
                  <option value="file">Image</option>
                </select>
              </div>
              {/* Min/Max Fields for Number */}
              {fieldType === 'number' && (
                <>
                  <div className="col-md-2">
                    <input type="number" className="form-control" placeholder="Min" disabled={otpRequired} value={minValue} onChange={(e) => setMinValue(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <input type="number" className="form-control" placeholder="Max" disabled={otpRequired} value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
                  </div>

                  {!fields.some((f) => f.otpRequired && f._id !== editId) && (
                    <div className="col-md-2 d-flex align-items-center">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={otpRequired}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setOtpRequired(checked);
                            if (checked) {
                              setLabel('Mobile No');
                              setMinValue(10);
                              setMaxValue(10);
                            }
                          }}
                        />
                        <label className="form-check-label">OTP Required</label>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="col-md-2">
                <button className={`btn w-100 ${editId ? 'btn-warning' : 'btn-primary'}`} onClick={handleAddOrUpdate}> {editId ? 'Update' : 'Add'} </button>
              </div>
            </div>

            <table className="table table-bordered table-hover text-center">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Validation</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) :fields.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-muted"> No fields added yet.</td>
                  </tr>
                ) :  (
                  fields.map((field, index) => (
                    <tr key={field._id}>
                      <td>{field.position}</td>
                      <td>{field.label}</td>
                      <td>{field.fieldType}</td>
                      <td>
                        {field.fieldType === 'number' && field.validation
                          ? `Min: ${field.validation.min || '-'} / Max: ${field.validation.max || '-'}`
                          : '-'}
                          {field.otpRequired && <div className="badge bg-success mt-1 ms-2"> OTP Enabled</div>}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(field)}><FaEdit /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteField(field._id)}> <FaTrash /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="modal-footer border-0 pt-0"><button className="btn btn-secondary" onClick={handleClose}>Close </button></div>
        </div>
      </div>
    </div>
  );
};

export default AddVisitorFieldModal;
