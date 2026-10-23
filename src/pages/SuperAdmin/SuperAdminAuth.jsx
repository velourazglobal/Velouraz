import React, { useState } from 'react';
import { auth, db } from "../../components/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

const SuperAdminAuth = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      let authenticatedUser = null;

      // 1. Try Firebase Authentication
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        authenticatedUser = userCredential.user;
      } catch (authErr) {
        console.warn("Firebase Auth fallback check:", authErr.message);
      }

      if (authenticatedUser) {
        // Check by UID doc
        const docRef = doc(db, "superadmins", authenticatedUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === 'superadmin') {
          onAuthSuccess(authenticatedUser);
          return;
        }

        // Check by email query in superadmins
        const q = query(collection(db, "superadmins"), where("email", "==", cleanEmail));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          onAuthSuccess(authenticatedUser);
          return;
        }

        await auth.signOut();
        setError("Access denied. Your account is not authorized as a Super Admin.");
        return;
      }

      // 2. Direct Firestore superadmins collection credential lookup
      const qSuper = query(
        collection(db, "superadmins"),
        where("email", "==", cleanEmail)
      );
      const superSnap = await getDocs(qSuper);

      let matchDoc = null;
      superSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.password === cleanPassword || data.role === "superadmin") {
          matchDoc = { id: docSnap.id, ...data };
        }
      });

      if (matchDoc) {
        onAuthSuccess({
          uid: matchDoc.id,
          email: matchDoc.email,
          displayName: matchDoc.displayName || matchDoc.adminId || "Super Admin",
          role: "superadmin"
        });
      } else {
        setError("Invalid Super Admin credentials. Please check your email and password.");
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace("Error (auth/", "").replace(").", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-900 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#811331]/20 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-rose-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-[#811331] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#811331]/30 mb-6">
                <span className="text-2xl font-serif tracking-widest font-bold">SA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Super Admin Portal
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Enter your credentials to access the executive super admin console.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[16px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Super Admin Email
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#811331]/40 focus:border-[#811331] transition-all"
                  placeholder="superadmin@velouraz.com"
                />
              </div>
              
              <div>
                <label className="block text-[16px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#811331]/40 focus:border-[#811331] transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl">
                  <p className="text-sm text-red-400 font-medium text-center">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#811331] hover:bg-[#9d1a3d] text-white rounded-xl font-bold shadow-lg shadow-[#811331]/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center mt-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Sign In to Super Admin'
                )}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-slate-950 border-t border-slate-800 text-center">
            <p className="text-[16px] text-slate-500">
              Restricted Executive Access • House of Velouraz
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-base text-slate-500">
          <p>&copy; {new Date().getFullYear()} House of Velouraz. Executive Control Portal.</p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAuth;
