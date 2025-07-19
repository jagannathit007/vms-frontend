import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaUser, FaClipboardList, FaPaperPlane, FaCheckCircle, FaExclamationTriangle, FaPhoneAlt } from "react-icons/fa";
import { BaseUrl } from "./service/Uri";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';

const VisitorForm = () => {
  const { companyId } = useParams();
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [companydata, setCompanydata] = useState(null); // Initialize as null
  const [otpSent, setOtpSent] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [otpVerified, setOtpVerified] = useState({});
  const [otpLoading, setOtpLoading] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [resendTimer, setResendTimer] = useState({});
  const [visitorStatus, setVisitorStatus] = useState({ isActive: false, fields: null }); // Visitor status
  const fileInputRefs = useRef({});
  const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await axios.get(`${BaseUrl}/visitor/visitor-fields/form/${companyId}`);
        if (res.data.status === 200) {
          setCustomFields(res.data.data || []);
        } else {
          setCustomFields([]);
        }
      } catch (error) {
        console.error("Error fetching dynamic fields", error);
        setCustomFields([]);
      }
    };

    const fetchCompanyData = async () => {
      try {
        const res = await axios.get(`${BaseUrl}/company/company-info/${companyId}`);
        if (res.data.status === 200) {
          setCompanydata(res.data.data || null);
        } else {
          setCompanydata(null);
        }
      } catch (error) {
        console.error("Error fetching company data", error);
        setCompanydata(null);
      }
    };

    fetchFields();
    fetchCompanyData();
  }, [companyId]);

  const checkVisitorStatus = async (label, number) => {
    try {
      const res = await axios.get(`${BaseUrl}/visitor/info`, {
        params: { companyId, label, number },
      });
      if (res.data.status === 200) {
        setVisitorStatus(res.data.data || { isActive: false, fields: null });
      } else {
        setVisitorStatus({ isActive: false, fields: null });
      }
    } catch (error) {
      console.error("Error checking visitor status", error);
      setVisitorStatus({ isActive: false, fields: null });
    }
  };

  const startResendCountdown = (label) => {
    let counter = 180; // 3 minutes
    setResendTimer((prev) => ({ ...prev, [label]: counter }));
    const interval = setInterval(() => {
      counter--;
      setResendTimer((prev) => {
        if (counter <= 0) {
          clearInterval(interval);
          const updated = { ...prev };
          delete updated[label];
          return updated;
        }
        return { ...prev, [label]: counter };
      });
    }, 1000);
  };

  const handleFileChange = async (e, label) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const finalFile = new File([compressedFile], file.name, { type: file.type });
      setFormData((prev) => ({ ...prev, [label]: finalFile }));
      setImagePreviews((prev) => ({
        ...prev,
        [label]: URL.createObjectURL(finalFile),
      }));
    } catch (err) {
      console.error("Compression Error:", err);
      setMessage("Error compressing image.");
    }
  };

  const handleSendOtp = async (label, mobile) => {
    try {
      setOtpLoading((prev) => ({ ...prev, [label]: true }));
      const res = await axios.post(`${BaseUrl}/visitor/otp/send`, { mobile, companyId });
      if (res.data.status === 200) {
        setOtpSent((prev) => ({ ...prev, [label]: true }));
        startResendCountdown(label);
        Toast.fire({ icon: 'success', title: 'OTP sent successfully!' });
      } else {
        Toast.fire({ icon: 'error', title: 'Failed to send OTP' });
      }
    } catch (err) {
      console.error("OTP send error", err);
      Toast.fire({ icon: 'error', title: 'Error sending OTP' });
    } finally {
      setOtpLoading((prev) => ({ ...prev, [label]: false }));
    }
  };

  const handleResendOtp = async (label, mobile) => {
    try {
      setOtpLoading((prev) => ({ ...prev, [label]: true }));
      const res = await axios.post(`${BaseUrl}/visitor/otp/send`, { mobile, companyId });
      if (res.data.status === 200) {
        startResendCountdown(label);
        Toast.fire({ icon: 'success', title: 'OTP resent successfully!' });
      } else {
        Toast.fire({ icon: 'error', title: 'Failed to resend OTP' });
      }
    } catch (err) {
      console.error("OTP resend error", err);
      Toast.fire({ icon: 'error', title: 'Error resending OTP' });
    } finally {
      setOtpLoading((prev) => ({ ...prev, [label]: false }));
    }
  };

  const handleVerifyOtp = async (label, mobile, otp) => {
    try {
      const res = await axios.post(`${BaseUrl}/visitor/otp/verify`, { mobile, otp, companyId });
      if (res.data.status === 200) {
        setOtpVerified((prev) => ({ ...prev, [label]: true }));
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'OTP verified!',
        }).then(() => {
          // Fetch visitor info after OTP verification
          axios.get(`${BaseUrl}/visitor/info`, {
            params: { companyId, label, number: mobile },
          })
            .then((infoRes) => {
              if (infoRes.data?.status === 200 && infoRes.data?.data) {
                const visitorFields = infoRes.data.data.fields || {};
                setVisitorStatus(infoRes.data.data); // Update visitor status

                if (!infoRes.data.data.isActive) {
                  setFormData((prev) => {
                    const updatedForm = { ...prev };
                    Object.entries(visitorFields).forEach(([key, value]) => {
                      if (!prev[key]) {
                        updatedForm[key] = value; // Only fill if empty
                      }
                    });
                    return updatedForm;
                  });
                }
              } else {
                setVisitorStatus({ isActive: false, fields: null });
              }
            })
            .catch((fetchErr) => {
              console.error("Visitor info fetch error", fetchErr);
              setMessage("Error fetching visitor info.");
              setVisitorStatus({ isActive: false, fields: null });
            });
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Incorrect OTP' });
      }
    } catch (err) {
      console.error("OTP verification error", err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'OTP verification failed' });
      setMessage("OTP verification failed.");
    }
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setFieldErrors({});

    for (let field of customFields) {
      const value = formData[field.label] || "";
      const minLength = field.validation?.min || 0;
      const maxLength = field.validation?.max || Infinity;

      if (field.fieldType === "number" && field?.validation?.min !== undefined && field?.validation?.max !== undefined) {
        if (value.length < minLength || value.length > maxLength) {
          setFieldErrors((prev) => ({
            ...prev,
            [field.label]: `"${field.label}" must be between ${minLength}-${maxLength} characters.`,
          }));
          setIsSubmitting(false);
          return;
        }
      }
      if (field.otpRequired && !otpVerified[field.label]) {
        setFieldErrors((prev) => ({
          ...prev,
          [field.label]: `Please verify OTP for "${field.label}".`,
        }));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const formPayload = new FormData();
      customFields.forEach((field) => {
        const value = formData[field.label];
        if (field.fieldType === "file" && value instanceof File) {
          formPayload.append(field.label, value);
        } else {
          formPayload.append(field.label, value || "");
        }
      });

      const res = await axios.post(`${BaseUrl}/visitor/create/${companyId}`, formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status === 200) {
        setMessage("Visitor entry submitted successfully!");
        setFormData({});
        setOtpSent({});
        setImagePreviews({});
        setOtpInputs({});
        setOtpVerified({});
        setVisitorStatus({ isActive: true, fields: formData });
        customFields.forEach((field) => {
          if (field.fieldType === "file" && fileInputRefs.current[field.label]) {
            fileInputRefs.current[field.label].value = null;
          }
        });
      } else {
        setMessage("Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error submitting form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitExit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const otpField = customFields.find((field) => field.otpRequired);
      if (!otpField) {
        setMessage("No OTP field configured.");
        setIsSubmitting(false);
        return;
      }

      const mobile = formData[otpField.label];
      const res = await axios.post(`${BaseUrl}/visitor/exit/${companyId}`, {
        mobile,
        label: otpField.label,
      });

      if (res.data.status === 200) {
        setMessage("Visitor exit recorded successfully!");
        setFormData({});
        setOtpSent({});
        setOtpInputs({});
        setOtpVerified({});
        setVisitorStatus({ isActive: false, fields: null });
      } else {
        setMessage("Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error recording exit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    position: "relative",
    overflow: "hidden",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    maxWidth: "500px",
    width: "100%",
  };

  const inputStyle = {
    border: "2px solid #e9ecef",
    borderRadius: "15px",
    padding: "15px 20px 15px 20px",
    fontSize: "16px",
    transition: "all 0.3s ease",
    background: "rgba(255,255,255,0.9)",
  };

  const isSuccess = message.includes("successfully");
  const isError = message.includes("Error") || message.includes("wrong");

  return (
    <>
      {companydata === null && customFields.length === 0 ? (
        <div style={containerStyle} className="d-flex align-items-center justify-content-center p-4">
          <div style={overlayStyle}></div>
          <div style={cardStyle} className="position-relative">
            <div className="p-4 p-sm-5 text-center">
              <h1 className="fw-bold text-danger mb-3">Form Not Found</h1>
              <p className="text-muted fs-5">
                Sorry, the form you're looking for cannot be found or may have been moved. This could be due to an expired link or the form being temporarily unavailable.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={containerStyle} className="d-flex align-items-center justify-content-center p-4">
          <a href="/watchmen">
            <button className="btn btn-primary position-absolute top-0 end-0 m-3 z-2">Watchmen Panel</button>
          </a>
          <div style={overlayStyle}></div>
          <div style={cardStyle} className="position-relative">
            <div className="card-body p-sm-5 p-3">
              <div className="text-center mb-4">
                <div className="mb-3">
                  {companydata?.logo && (
                    <img
                      src={`${BaseUrl}/${companydata.logo}`}
                      alt="Logo Image"
                      className="d-inline-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: "80px", height: "80px", boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)" }}
                    />
                  )}
                </div>
                <h2 className="fw-bold mb-2" style={{ color: "#2d3748" }}>
                  {companydata?.name || "Loading..."}
                </h2>
                <p className="text-muted mb-0">
                  {visitorStatus.isActive ? "Please verify your mobile number to exit" : "Please fill in your details to register your visit"}
                </p>
              </div>

              {visitorStatus.isActive ? (
                // Exit Form
                <form onSubmit={handleSubmitExit}>
                  {customFields.find((field) => field.otpRequired) && (
                    <div className="mb-4 position-relative">
                      <label className="form-label fw-semibold text-dark mb-2 text-capitalize">
                        {customFields.find((field) => field.otpRequired).label}
                      </label>
                      <input
                        type="tel"
                        className="form-control text-capitalize"
                        style={inputStyle}
                        placeholder={`Enter ${customFields.find((field) => field.otpRequired).label.toLowerCase()}`}
                        value={formData[customFields.find((field) => field.otpRequired).label] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const field = customFields.find((f) => f.otpRequired);
                          const maxLength = field.validation?.max || 100;
                          const minLength = field.validation?.min || 0;
                          if (value.length >= minLength && value.length <= maxLength) {
                            setFieldErrors((prev) => ({ ...prev, [field.label]: "" }));
                          }
                          if (value.length <= maxLength) {
                            setFormData((prev) => ({ ...prev, [field.label]: value }));
                            checkVisitorStatus(field.label, value);
                          }
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                        onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                        required
                      />
                      {fieldErrors[customFields.find((field) => field.otpRequired).label] && (
                        <div className="text-danger mt-2">{fieldErrors[customFields.find((field) => field.otpRequired).label]}</div>
                      )}

                      {!otpSent[customFields.find((field) => field.otpRequired).label] ? (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm mt-2"
                          onClick={() => {
                            const field = customFields.find((f) => f.otpRequired);
                            const value = formData[field.label] || "";
                            const minLength = field.validation?.min || 0;
                            const maxLength = field.validation?.max || 100;
                            if (!/^\d+$/.test(value)) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                [field.label]: `"${field.label}" must contain only digits.`,
                              }));
                              return;
                            }
                            if (value.length < minLength || value.length > maxLength) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                [field.label]: `"${field.label}" must be between ${minLength}-${maxLength} digits.`,
                              }));
                              return;
                            }
                            setFieldErrors((prev) => ({ ...prev, [field.label]: "" }));
                            handleSendOtp(field.label, value);
                          }}
                          disabled={!formData[customFields.find((field) => field.otpRequired).label] || otpLoading[customFields.find((field) => field.otpRequired).label]}
                        >
                          {otpLoading[customFields.find((field) => field.otpRequired).label] ? "Sending..." : "Send OTP"}
                        </button>
                      ) : !otpVerified[customFields.find((field) => field.otpRequired).label] ? (
                        <>
                          <div className="d-flex align-items-center mt-2">
                            <input
                              type="text"
                              className="form-control me-2"
                              placeholder="Enter OT"
                              value={otpInputs[customFields.find((field) => field.otpRequired).label] || ""}
                              onChange={(e) => setOtpInputs((prev) => ({ ...prev, [customFields.find((field) => field.otpRequired).label]: e.target.value }))}
                            />
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => handleVerifyOtp(customFields.find((field) => field.otpRequired).label, formData[customFields.find((field) => field.otpRequired).label], otpInputs[customFields.find((field) => field.otpRequired).label])}
                            >
                              Verify
                            </button>
                          </div>
                          {resendTimer[customFields.find((field) => field.otpRequired).label] > 0 ? (
                            <div className="text-muted mt-1 small">
                              Resend available in {Math.floor(resendTimer[customFields.find((field) => field.otpRequired).label] / 60)}:{String(resendTimer[customFields.find((field) => field.otpRequired).label] % 60).padStart(2, "0")}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm mt-2"
                              onClick={() => handleResendOtp(customFields.find((field) => field.otpRequired).label, formData[customFields.find((field) => field.otpRequired).label])}
                            >
                              Resend OTP
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-success mt-2">OTP Verified</div>
                      )}
                    </div>
                  )}

                  <button
                    className="btn btn-lg w-100 text-white fw-semibold py-3 mt-3"
                    type="submit"
                    disabled={isSubmitting || !otpVerified[customFields.find((field) => field.otpRequired)?.label]}
                    style={{
                      background: "linear-gradient(135deg, #667eea, #764ba2)",
                      border: "none",
                      borderRadius: "15px",
                      boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" /> Record Exit
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Entry Form
                <form onSubmit={handleSubmitEntry}>
                  {customFields && customFields.length > 0 ? (
                    customFields.map((field) => (
                      <div className="mb-4 position-relative" key={field._id}>
                        <label className="form-label fw-semibold text-dark mb-2 text-capitalize">{field.label}</label>
                        {field.fieldType === "textarea" ? (
                          <textarea
                            className="form-control text-capitalize"
                            style={inputStyle}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            value={formData[field.label] || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, [field.label]: e.target.value }))}
                            required
                            rows={3}
                            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                            onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                          />
                        ) : field.fieldType === "file" ? (
                          <>
                            <input
                              ref={(el) => (fileInputRefs.current[field.label] = el)}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="form-control"
                              style={inputStyle}
                              onChange={(e) => handleFileChange(e, field.label)}
                              required
                            />
                            {imagePreviews[field.label] && (
                              <div className="mt-3">
                                <img src={imagePreviews[field.label]} alt="Preview" style={{ width: "100%", maxWidth: 250, borderRadius: "10px" }} />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type={field.fieldType}
                              className="form-control text-capitalize"
                              style={inputStyle}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              value={formData[field.label] || ""}
                              required
                              disabled={(otpSent[field.label] && resendTimer[field.label] > 0) || otpVerified[field.label]}
                              onChange={(e) => {
                                const value = e.target.value;
                                const maxLength = field.validation?.max || 100;
                                const minLength = field.validation?.min || 0;
                                if (value.length >= minLength && value.length <= maxLength) {
                                  setFieldErrors((prev) => ({ ...prev, [field.label]: "" }));
                                }
                                if (value.length <= maxLength) {
                                  setFormData((prev) => ({ ...prev, [field.label]: value }));
                                  if (field.otpRequired) {
                                    checkVisitorStatus(field.label, value);
                                  }
                                }
                              }}
                              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                            />

                            {field.otpRequired && (
                              <div className="mt-2">
                                {!otpSent[field.label] ? (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => {
                                      const value = formData[field.label] || "";
                                      const minLength = field.validation?.min || 0;
                                      const maxLength = field.validation?.max || 100;
                                      if (!/^\d+$/.test(value)) {
                                        setFieldErrors((prev) => ({
                                          ...prev,
                                          [field.label]: `"${field.label}" must contain only digits.`,
                                        }));
                                        return;
                                      }
                                      if (value.length < minLength || value.length > maxLength) {
                                        setFieldErrors((prev) => ({
                                          ...prev,
                                          [field.label]: `"${field.label}" must be between ${minLength}-${maxLength} digits.`,
                                        }));
                                        return;
                                      }
                                      setFieldErrors((prev) => ({ ...prev, [field.label]: "" }));
                                      handleSendOtp(field.label, value);
                                    }}
                                    disabled={!formData[field.label] || otpLoading[field.label]}
                                  >
                                    {otpLoading[field.label] ? "Sending..." : "Send OTP"}
                                  </button>
                                ) : !otpVerified[field.label] ? (
                                  <>
                                    <div className="d-flex align-items-center mt-2">
                                      <input
                                        type="text"
                                        className="form-control me-2"
                                        placeholder="Enter OTP"
                                        value={otpInputs[field.label] || ""}
                                        onChange={(e) => setOtpInputs((prev) => ({ ...prev, [field.label]: e.target.value }))}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={() => handleVerifyOtp(field.label, formData[field.label], otpInputs[field.label])}
                                      >
                                        Verify
                                      </button>
                                    </div>

                                    {resendTimer[field.label] > 0 ? (
                                      <div className="text-muted mt-1 small">
                                        Resend available in {Math.floor(resendTimer[field.label] / 60)}:{String(resendTimer[field.label] % 60).padStart(2, "0")}
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm mt-2"
                                        onClick={() => handleResendOtp(field.label, formData[field.label])}
                                      >
                                        Resend OTP
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-success mt-2">OTP Verified</div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        {fieldErrors[field.label] && <div className="text-danger mt-2">{fieldErrors[field.label]}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted">
                      <p>No custom fields available for this company.</p>
                      <p>Please contact the administrator if you believe this is an error.</p>
                    </div>
                  )}

                  {customFields.length > 0 && (
                    <button
                      className="btn btn-lg w-100 text-white fw-semibold py-3 mt-3"
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        border: "none",
                        borderRadius: "15px",
                        boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="me-2" /> Submit Registration
                        </>
                      )}
                    </button>
                  )}
                </form>
              )}

              {message && (
                <div
                  className={`mt-4 p-4 rounded-3 d-flex align-items-center ${
                    isSuccess ? "bg-success bg-opacity-10 text-success" : isError ? "bg-danger bg-opacity-10 text-danger" : "bg-info bg-opacity-10 text-info"
                  }`}
                  style={{
                    border: `2px solid ${isSuccess ? "#198754" : isError ? "#dc3545" : "#0dcaf0"}20`,
                    animation: "fadeIn 0.5s ease-in",
                  }}
                >
                  <div className="me-3">
                    {isSuccess && <FaCheckCircle size={20} />}
                    {isError && <FaExclamationTriangle size={20} />}
                    {!isSuccess && !isError && <FaClipboardList size={20} />}
                  </div>
                  <div>
                    <strong>{message}</strong>
                    {isSuccess && (
                      <div className="small mt-1 opacity-75">
                        {visitorStatus.isActive ? "Thank you for registering. You may now proceed with your visit." : "Exit recorded successfully."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                top: "-50px",
                right: "-50px",
                width: "100px",
                height: "100px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                borderRadius: "50%",
                opacity: 0.1,
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                bottom: "-30px",
                left: "-30px",
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #764ba2, #667eea)",
                borderRadius: "50%",
                opacity: 0.1,
              }}
            ></div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .form-control:focus { box-shadow: 0 0 20px rgba(102, 126, 234, 0.2) !important; }
          `}</style>
        </div>
      )}
    </>
  );
};

export default VisitorForm;