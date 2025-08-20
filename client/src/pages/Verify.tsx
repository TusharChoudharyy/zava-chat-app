import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

const Verify = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);

  const handleChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || ""; // Email passed from AuthPage

  const handleSubmit = async () => {
    const otpCode = otp.join(""); // Combine ["1","2","3","4"] → "1234"

    if (!otpCode || otpCode.length !== 4) {
      toast.error("Please enter the 4-digit OTP");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpCode }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("OTP verified successfully!");
        navigate("/home");
      } else {
        toast.error(data.error || "OTP verification failed");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Enter OTP</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Please enter the 4-digit OTP sent to your email.
        </p>
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              className="w-12 h-12 border rounded text-center text-xl"
            />
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
        >
          Verify
        </button>
        <p className="text-xs text-center text-gray-400 mt-4">
          Didn't get the code?{" "}
          <span className="text-purple-600 cursor-pointer">Resend</span>
        </p>
      </div>
    </div>
  );
};

export default Verify;
