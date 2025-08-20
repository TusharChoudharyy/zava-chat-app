import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [method, setMethod] = useState(null); // "email" | "phone" | null
  const [inputValue, setInputValue] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
const navigate = useNavigate();
  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setMethod(null); // reset method when switching mode
    setInputValue("");
  };



const handleVerify = async () => {
  if (!inputValue.trim()) {
    toast.error("Please enter a valid email or phone number");
    return;
  }

  try {
    const payload =
      method === "email"
        ? { email: inputValue }
        : { phone: `${countryCode}${inputValue}` };

    const response = await fetch("http://localhost:5000/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success("OTP sent successfully!");
      navigate("/verify", { state: { email: inputValue } });
    } else {
      toast.error(data.error || "Failed to send OTP");
    }
  } catch (err) {
    console.error("Error sending OTP:", err);
    toast.error("Something went wrong. Please try again.");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-3xl">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          {mode === "login"
            ? "Welcome to Zava.chat"
            : "Create your Zava account"}
        </h1>
        {/* Authentication Method Selector */}
        {!method && (
          <div className="space-y-4">
            <AuthButton
              icon={<Mail size={20} />}
              label={
                mode === "login" ? "Continue with Email" : "Sign up with Email"
              }
              onClick={() => setMethod("email")}
            />
            <AuthButton
              icon={<Phone size={20} />}
              label={
                mode === "login"
                  ? "Continue with Mobile"
                  : "Sign up with Mobile"
              }
              onClick={() => setMethod("phone")}
            />
          </div>
        )}

        {/* Input Field for Email or Phone */}
        {method && (
          <div className="space-y-4">
            {method === "email" ? (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm"
                  placeholder="you@example.com"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="border rounded-lg px-2 py-2 text-sm"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    {/* Add more as needed */}
                  </select>
                  <input
                    type="tel"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-sm"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleVerify}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Verify
            </button>

            <button
              onClick={() => setMethod(null)}
              className="text-sm text-gray-500 hover:underline block mx-auto"
            >
              ← Back to method selection
            </button>
          </div>
        )}

        {/* Footer Switch Login <-> Signup */}
        {!method && (
          <div className="text-center mt-6 text-sm text-gray-600">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Login
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AuthButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition duration-200"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
