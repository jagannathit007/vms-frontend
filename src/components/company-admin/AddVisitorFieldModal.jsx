import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BaseUrl } from '../service/Uri';
import { FaTrash, FaEdit } from 'react-icons/fa';

const AddVisitorFieldModal = ({ show, onClose }) => {
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fields, setFields] = useState([]);
  const [editId, setEditId] = useState(null);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const token = localStorage.getItem('companyToken');

  const fetchFields = async () => {
    try {
      const res = await axios.get(`${BaseUrl}/visitor/visitor-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 200) {
        setFields(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };
  useEffect(() => {
    if (show) fetchFields();
  }, [show]);

  const handleAddOrUpdate = async () => {
    if (!label) return;
     if (fieldType === 'number') {
    const min = minValue ? Number(minValue) : undefined;
    const max = maxValue ? Number(maxValue) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      return alert("Min value cannot be greater than Max value.");
    }
  }

    const payload = {
      label,
      fieldType,
      ...(fieldType === 'number' && {
        validation: {
          min: minValue ? Number(minValue) : undefined,
          max: maxValue ? Number(maxValue) : undefined,
        },
      }),
    };

    try {
      if (editId) {
        await axios.put(`${BaseUrl}/visitor/visitor-fields/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditId(null);
      } else {
        await axios.post(`${BaseUrl}/visitor/visitor-fields`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setLabel('');
      setFieldType('text');
      setMinValue('');
      setMaxValue('');
      fetchFields();
    } catch (error) {
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
  };

  const handleClose = () => {
    setLabel('');
    setFieldType('text');
    setEditId(null);
    setMinValue('');
    setMaxValue('');
    onClose();
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
            {/* Form Controls */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Field Label" value={label} onChange={(e) => setLabel(e.target.value)} />
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
                    <input type="number" className="form-control" placeholder="Min" value={minValue} onChange={(e) => setMinValue(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <input type="number" className="form-control" placeholder="Max" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
                  </div>
                </>
              )}

              <div className="col-md-2">
                <button className={`btn w-100 ${editId ? 'btn-warning' : 'btn-primary'}`} onClick={handleAddOrUpdate}> {editId ? 'Update' : 'Add'} </button>
              </div>
            </div>

            {/* Field List */}
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
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-muted"> No fields added yet.</td>
                  </tr>
                ) : (
                  fields.map((field, index) => (
                    <tr key={field._id}>
                      <td>{index + 1}</td>
                      <td>{field.label}</td>
                      <td>{field.fieldType}</td>
                      <td>
                        {field.fieldType === 'number' && field.validation
                          ? `Min: ${field.validation.min || '-'} / Max: ${field.validation.max || '-'}`
                          : '-'}
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
