// export const BaseUrl = "https://vms.itfuturz.in"
// export const FrontendUrl = "https://visitor-ms.itfuturz.in"

export const BaseUrl = "http://localhost:3000"
export const FrontendUrl = "http://localhost:5173"



    // name: { type: String, default: "" },
    // number: { type: Number, default: "" },
    // purpose: { type:String , default:"" },





        // const visitors = await visitor.create({
        //     name,
        //     number,
        //     purpose,
        //     companyId
        // })


            // {/* Name Field */}
            // <div className="mb-4 position-relative">
            //   <label className="form-label fw-semibold text-dark mb-2">
            //     Full Name
            //   </label>
            //   <div className="position-relative">
            //     <div style={iconContainerStyle}>
            //       <FaUser size={18} />
            //     </div>
            //     <input 
            //       type="text" 
            //       className="form-control"
            //       style={inputStyle}
            //       placeholder="Enter your full name" 
            //       value={formData.name} 
            //       onChange={e => setFormData({ ...formData, name: e.target.value })} 
            //       required 
            //       onFocus={(e) => e.target.style.borderColor = '#667eea'}
            //       onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            //     />
            //   </div>
            // </div>

            // {/* Mobile Number Field */}
            // <div className="mb-4 position-relative">
            //   <label className="form-label fw-semibold text-dark mb-2">
            //     Mobile Number
            //   </label>
            //   <div className="position-relative">
            //     <div style={iconContainerStyle}>
            //       <FaPhoneAlt size={18} />
            //     </div>
            //     <input 
            //       type="tel" 
            //       className="form-control"
            //       style={inputStyle}
            //       placeholder="Enter your mobile number" 
            //       value={formData.number} 
            //       onChange={e => {
            //         const val = e.target.value;
            //         // Allow only digits
            //         if (/^\d{0,10}$/.test(val)) {
            //           setFormData({ ...formData, number: val });
            //         }
            //       }}
            //       required 
            //       maxLength={10}
            //       pattern="\d{10}"
            //       onFocus={(e) => e.target.style.borderColor = '#667eea'}
            //       onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            //     />
            //   </div>
            // </div>

            // {/* Purpose Field */}
            // <div className="mb-4 position-relative">
            //   <label className="form-label fw-semibold text-dark mb-2">
            //     Purpose of Visit
            //   </label>
            //   <div className="position-relative">
            //     <div style={iconContainerStyle}>
            //       <FaClipboardList size={18} />
            //     </div>
            //     <input 
            //       type="text" 
            //       className="form-control"
            //       style={inputStyle}
            //       placeholder="Enter purpose of your visit" 
            //       value={formData.purpose} 
            //       onChange={e => setFormData({ ...formData, purpose: e.target.value })} 
            //       required 
            //       onFocus={(e) => e.target.style.borderColor = '#667eea'}
            //       onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            //     />
            //   </div>
            // </div>