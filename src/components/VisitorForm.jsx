import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaClipboardList,FaPaperPlane,FaCheckCircle,FaExclamationTriangle,FaPhoneAlt,} from "react-icons/fa";
import { BaseUrl } from "./service/Uri";
import "bootstrap/dist/css/bootstrap.min.css";

const VisitorForm = () => {
  const { companyId } = useParams();
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [companydata, setcompanydata] = useState();

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await axios.get(
          `${BaseUrl}/visitor/visitor-fields/form/${companyId}`
        );
        if (res.data.status === 200) {
          setCustomFields(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching dynamic fields", error);
      }
    };
    const fetchcompanydata = async () => {
      try {
        const res = await axios.get(
          `${BaseUrl}/company/company-info/${companyId}`
        );
        if (res.data.status === 200) {
          setcompanydata(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching company data", error);
      }
    };
    fetchFields();
    fetchcompanydata();
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setFieldErrors({});
    // Validation logic
    for (let field of customFields) {
      const value = formData[field.label] || "";
      const minLength = field.validation?.min || 0;
      const maxLength = field.validation?.max || Infinity;
      if (
        field.fieldType === "number" &&
        field.validation.min !== undefined &&
        field.validation.max !== undefined
      ) {
        if (value.length < minLength) {
          setFieldErrors((prev) => ({
            ...prev,
            [field.label]: `"${field.label}" must be at least ${minLength} and no more than ${maxLength} characters.`,
          }));
          setIsSubmitting(false);
          return;
        }
        if (value.length > maxLength) {
          setNumberErrorMessage(
            `"${field.label}" must be no more than ${maxLength} characters.`
          );
          setIsSubmitting(false);
          return;
        }
      }
    }
   try {
    const formPayload = new FormData();

    customFields.forEach((field) => {
      const value = formData[field.label];

      if (field.fieldType === "image" && value instanceof File) {
        // Append the actual file object
        formPayload.append(field.label, value);
      } else {
        formPayload.append(field.label, value || "");
      }
    });

    const res = await axios.post(`${BaseUrl}/visitor/create/${companyId}`, formPayload, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.status === 200) {
      setMessage("Visitor submitted successfully!");
      setFormData({});
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
    <div style={containerStyle} className="d-flex align-items-center justify-content-center p-4">
      <div style={overlayStyle}></div>
      <div style={cardStyle} className="position-relative">
        <div className="card-body p-sm-5 p-3">
          {/* Header Section */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <div>
                <img
                  src={`${BaseUrl}/${companydata?.logo}`}
                  alt="Logo Image"
                  className="d-inline-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: "80px", height: "80px", boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
                  }} />
              </div>
            </div>
            <h2 className="fw-bold mb-2" style={{ color: "#2d3748" }}>{companydata?.name}</h2>
            <p className="text-muted mb-0"> Please fill in your details to register your visit</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit}>
            {customFields && customFields.length > 0 ? (
              customFields.map((field) => (
                <div className="mb-4 position-relative" key={field._id}>
                  <label className="form-label fw-semibold text-dark mb-2 text-capitalize"> {field.label} </label>
                  <div className="position-relative">
                    {field.fieldType === "textarea" ? (
                      <textarea
                        className="form-control text-capitalize"
                        style={inputStyle}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={formData[field.label] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value, }) }
                        required
                        rows={3}
                        onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                        onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                      />
                    ) : field.fieldType === "file" ? (
          <input
            type="file"
            accept="image/*"
            className="form-control"
            style={inputStyle}
            onChange={(e) =>
              setFormData({
                ...formData,
                [field.label]: e.target.files[0],
              })
            }
            required
          />
        ) : (
                      <input
                        type={field.fieldType}
                        className="form-control text-capitalize"
                        style={inputStyle}
                        onChange={(e) => {
                          const value = e.target.value;
                          const maxLength = field.validation?.max || 100; // Default max length if not specified
                          const minLength = field.validation?.min || 0; // Default min length if not specified
                          if ( value.length >= minLength && value.length <= maxLength ) {
                            setFieldErrors((prev) => ({ ...prev, [field.label]: "", }));
                          }
                          if (value.length <= maxLength) {
                            setFormData({ ...formData, [field.label]: value });
                          }
                        }}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={formData[field.label] || ""}
                        required
                        onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                        onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                      />
                    )}
                    {fieldErrors[field.label] && ( <div className="text-danger mt-2"> {fieldErrors[field.label]} </div> )}
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Name Field */}
                <div className="mb-4 position-relative">
                  <label className="form-label fw-semibold text-dark mb-2"> Full Name </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      style={inputStyle}
                      placeholder="Enter your full name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value }) }
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                      onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                    />
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div className="mb-4 position-relative">
                  <label className="form-label fw-semibold text-dark mb-2"> Mobile Number </label>
                  <div className="position-relative">
                    <input
                      type="tel"
                      className="form-control"
                      style={inputStyle}
                      placeholder="Enter your mobile number"
                      value={formData.number || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d{0,10}$/.test(val)) {
                          setFormData({ ...formData, number: val });
                        }
                      }}
                      required
                      maxLength={10}
                      pattern="\d{10}"
                      onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                      onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                    />
                  </div>
                </div>

                {/* Purpose Field */}
                <div className="mb-4 position-relative">
                  <label className="form-label fw-semibold text-dark mb-2"> Purpose of Visit</label>
                  <div className="position-relative">
                    <textarea
                      className="form-control"
                      style={inputStyle}
                      placeholder="Enter purpose of your visit"
                      value={formData.purpose || ""}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                      onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              className="btn btn-lg w-100 text-white fw-semibold py-3 mt-3"
              type="submit"
              disabled={isSubmitting}
              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", border: "none", borderRadius: "15px", boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)", transition: "all 0.3s ease", }}
              onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";}}
              onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)"; }} >
              {isSubmitting ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status" > <span className="visually-hidden">Loading...</span></div>
                  Submitting...
                </>
              ) : (
                <> <FaPaperPlane className="me-2" /> Submit Registration</>
              )}
            </button>
          </form>

          {/* Message Section */}
          {message && (
            <div className={`mt-4 p-4 rounded-3 d-flex align-items-center ${
                isSuccess
                  ? "bg-success bg-opacity-10 text-success"
                  : isError
                  ? "bg-danger bg-opacity-10 text-danger"
                  : "bg-info bg-opacity-10 text-info"
              }`}
              style={{ border: `2px solid ${ isSuccess ? "#198754" : isError ? "#dc3545" : "#0dcaf0" }20`, animation: "fadeIn 0.5s ease-in", }}>
              <div className="me-3">
                {isSuccess && <FaCheckCircle size={20} />}
                {isError && <FaExclamationTriangle size={20} />}
                {!isSuccess && !isError && <FaClipboardList size={20} />}
              </div>
              <div>
                <strong>{message}</strong>
                {isSuccess && (
                  <div className="small mt-1 opacity-75"> Thank you for registering. You may now proceed with your visit. </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "100px", height: "100px", background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: "50%", opacity: 0.1, }}></div>
        <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "60px", height: "60px", background: "linear-gradient(135deg, #764ba2, #667eea)", borderRadius: "50%", opacity: 0.1, }} ></div>
      </div>

      {/* Custom CSS for animations */}
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
        
        .form-control:focus {
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default VisitorForm;
