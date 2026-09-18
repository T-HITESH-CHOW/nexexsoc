import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  User, 
  Key, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Send, 
  EyeOff, 
  Eye 
} from "lucide-react";

export default function VulnerableAppPage() {
  const [activeSubTab, setActiveSubTab] = useState("login"); // "login", "profile", "comments"

  // 1. SQLi Login state
  const [username, setUsername] = useState("admin' OR '1'='1' --");
  const [password, setPassword] = useState("any_password");
  const [loginResponse, setLoginResponse] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // 2. IDOR Profile state
  const [sessionUser, setSessionUser] = useState("101"); // Authenticated as Alice
  const [targetId, setTargetId] = useState("102"); // Requesting Bob CFO
  const [profileResponse, setProfileResponse] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // 3. Stored XSS Comments state
  const [comments, setComments] = useState([]);
  const [commentAuthor, setCommentAuthor] = useState("SecurityTester");
  const [commentContent, setCommentContent] = useState("<script>alert('XSS Exploit Successful')</script>");
  const [commentResponse, setCommentResponse] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Load comments
  const loadComments = async () => {
    try {
      const res = await fetch("/vulnerable/comments");
      const data = await res.json();
      if (data && data.comments) setComments(data.comments);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeSubTab === "comments") loadComments();
  }, [activeSubTab]);

  // SQLi Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginResponse(null);
    try {
      const res = await fetch("/vulnerable/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      setLoginResponse({ status: res.status, data });
    } catch (err) {
      setLoginResponse({ status: 500, data: { error: err.message } });
    } finally {
      setLoginLoading(false);
    }
  };

  // IDOR Profile Lookup
  const handleProfileLookup = async (idToFetch) => {
    setProfileLoading(true);
    setProfileResponse(null);
    const id = idToFetch || targetId;
    try {
      const res = await fetch(`/vulnerable/profile/${id}`, {
        headers: { "X-Session-User-Id": sessionUser }
      });
      const data = await res.json();
      setProfileResponse({ status: res.status, data });
    } catch (err) {
      setProfileResponse({ status: 500, data: { error: err.message } });
    } finally {
      setProfileLoading(false);
    }
  };

  // XSS Comment Submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setCommentsLoading(true);
    setCommentResponse(null);
    try {
      const res = await fetch("/vulnerable/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: commentAuthor, content: commentContent })
      });
      const data = await res.json();
      setCommentResponse({ status: res.status, data });
      loadComments();
    } catch (err) {
      setCommentResponse({ status: 500, data: { error: err.message } });
    } finally {
      setCommentsLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Prominent Educational Lab Warning Banner (Section 19) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-red-950/60 border-2 border-amber-500/50 shadow-lg text-amber-200 text-xs font-mono flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              ⚠ CONTROLLED SECURITY TRAINING ENVIRONMENT (LOCAL ONLY)
            </div>
            <p className="text-amber-300/80 text-[11px] mt-0.5">
              These endpoints intentionally lack input validation and authorization checks for cyber defense instruction.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
          ISOLATED LOCAL RANGE
        </span>
      </div>

      {/* Sub navigation */}
      <div className="flex rounded-lg bg-soc-card p-1 border border-soc-border max-w-md text-xs font-medium">
        <button
          onClick={() => setActiveSubTab("login")}
          className={`flex-1 py-2 rounded-md transition text-center ${
            activeSubTab === "login" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          1. Vulnerable Login (SQLi)
        </button>
        <button
          onClick={() => setActiveSubTab("profile")}
          className={`flex-1 py-2 rounded-md transition text-center ${
            activeSubTab === "profile" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          2. Profiles Directory (IDOR)
        </button>
        <button
          onClick={() => setActiveSubTab("comments")}
          className={`flex-1 py-2 rounded-md transition text-center ${
            activeSubTab === "comments" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          3. Comments Board (XSS)
        </button>
      </div>

      {/* TAB 1: SQL Injection */}
      {activeSubTab === "login" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Form Card */}
          <div className="p-6 rounded-xl bg-soc-card border border-soc-border space-y-4">
            <div className="border-b border-soc-border pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                Employee Authentication Gateway (Vulnerable to SQLi)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Constructs raw SQL queries without parameterized prepared statements.
              </p>
            </div>

            {/* Quick helper buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Quick Payload Injection:</span>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => { setUsername("admin' OR '1'='1' --"); setPassword("any"); }}
                  className="px-2.5 py-1 rounded bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 transition"
                >
                  admin' OR '1'='1' --
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("' OR 1=1 --"); setPassword("x"); }}
                  className="px-2.5 py-1 rounded bg-orange-950/60 border border-orange-800 text-orange-300 hover:bg-orange-900 transition"
                >
                  ' OR 1=1 --
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("alice"); setPassword("password123"); }}
                  className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition"
                >
                  Legitimate: alice / password123
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Username Parameter</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Password Parameter</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Unsafe SQL Query: </span>
                <span className="text-yellow-400">
                  SELECT * FROM users WHERE username = '{username}' AND password = '{password}';
                </span>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>{loginLoading ? "Authenticating..." : "Execute Authentication Request"}</span>
              </button>
            </form>
          </div>

          {/* Response Inspector Card */}
          <div className="p-6 rounded-xl bg-soc-card border border-soc-border flex flex-col justify-between">
            <div>
              <div className="border-b border-soc-border pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono">Server Response & Telemetry Hook</h3>
                {loginResponse && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    loginResponse.status === 200 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    HTTP {loginResponse.status}
                  </span>
                )}
              </div>

              {loginResponse ? (
                <div className="mt-4 space-y-3 font-mono text-xs">
                  {loginResponse.data?.flag === "SQLI_BYPASS_SUCCESS" ? (
                    <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300">
                      <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>SQL INJECTION BYPASS SUCCESSFUL!</span>
                      </div>
                      <p className="text-[11px]">{loginResponse.data.message}</p>
                      <div className="mt-2 text-[10px] text-yellow-400">
                        Generated Telemetry: <strong>{loginResponse.data.telemetry_event_id}</strong>
                      </div>
                    </div>
                  ) : loginResponse.status === 200 ? (
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300">
                      <div className="font-bold text-sm mb-1">Legitimate Login Authorized</div>
                      <p className="text-[11px]">{loginResponse.data.message}</p>
                    </div>
                  ) : loginResponse.status === 403 ? (
                    <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/70 text-red-300">
                      <div className="font-bold text-sm mb-1">THREAT CONTAINED (403 FORBIDDEN)</div>
                      <p className="text-[11px]">{loginResponse.data.message}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                      <div className="font-bold text-sm mb-1 text-slate-300">Authentication Failed</div>
                      <p className="text-[11px]">{loginResponse.data.error}</p>
                    </div>
                  )}

                  <pre className="p-3 rounded-lg bg-black/80 border border-slate-800 text-cyan-400 overflow-x-auto text-[11px]">
                    {JSON.stringify(loginResponse.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 font-mono text-xs">
                  Submit credentials above to observe application behavior and live telemetry generation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDOR */}
      {activeSubTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="p-6 rounded-xl bg-soc-card border border-soc-border space-y-4">
            <div className="border-b border-soc-border pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" />
                Employee Profile Service (Vulnerable to IDOR)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fails to verify if the requesting authenticated user owns the requested record ID.
              </p>
            </div>

            {/* Current Active Session */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400">Active Authenticated Session:</div>
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>User 101 — Alice Vance (Junior Security Analyst)</span>
              </div>
            </div>

            {/* Target Selectors */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300">Select Target Profile ID to Query:</label>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => { setTargetId("101"); handleProfileLookup("101"); }}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    targetId === "101" ? "border-blue-500 bg-blue-950/40 text-blue-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="font-bold">ID: 101</div>
                  <div className="text-[10px]">Alice (Self)</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setTargetId("102"); handleProfileLookup("102"); }}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    targetId === "102" ? "border-orange-500 bg-orange-950/40 text-orange-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="font-bold text-orange-400">ID: 102</div>
                  <div className="text-[10px]">Bob (CFO - High Val)</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setTargetId("103"); handleProfileLookup("103"); }}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    targetId === "103" ? "border-red-500 bg-red-950/40 text-red-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="font-bold text-red-400">ID: 103</div>
                  <div className="text-[10px]">Sarah (CISO - Root)</div>
                </button>
              </div>
            </div>

            <div className="p-3 rounded bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500">Request: </span>
              <span className="text-yellow-400">GET /vulnerable/profile/{targetId}</span>
              <div className="text-[10px] text-slate-500 mt-1">Header: X-Session-User-Id: 101</div>
            </div>

            <button
              onClick={() => handleProfileLookup()}
              disabled={profileLoading}
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50"
            >
              {profileLoading ? "Querying..." : `Inspect Profile ID: ${targetId} (IDOR Probe)`}
            </button>
          </div>

          {/* Response / Confidential Dossier */}
          <div className="p-6 rounded-xl bg-soc-card border border-soc-border flex flex-col justify-between">
            <div>
              <div className="border-b border-soc-border pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono">Dossier Data Exposure</h3>
                {profileResponse && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    profileResponse.status === 200 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    HTTP {profileResponse.status}
                  </span>
                )}
              </div>

              {profileResponse?.data?.profile ? (
                <div className="mt-4 space-y-3 font-mono text-xs">
                  {targetId !== "101" && (
                    <div className="p-3 rounded-lg bg-orange-950/40 border border-orange-500/50 text-orange-300">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span>CONFIDENTIAL CROSS-TENANT DATA BREACHED!</span>
                      </div>
                      <p className="text-[11px] mt-1">
                        Alice (Analyst) successfully read executive profile without authorization!
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Full Name:</span>
                      <span className="text-white font-bold">{profileResponse.data.profile.full_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Security Role:</span>
                      <span className="text-yellow-400 font-bold">{profileResponse.data.profile.role}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Compensated Balance:</span>
                      <span className="text-emerald-400 font-bold">${profileResponse.data.profile.balance?.toLocaleString()}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400 block mb-1">Confidential Secret Note:</span>
                      <div className="p-2.5 rounded bg-black/60 border border-red-900/60 text-red-300 text-[11px]">
                        {profileResponse.data.profile.secret_note}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 font-mono text-xs">
                  Select a profile ID to trigger cross-tenant object lookup.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Stored XSS */}
      {activeSubTab === "comments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="p-6 rounded-xl bg-soc-card border border-soc-border space-y-4">
            <div className="border-b border-soc-border pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Public Training Comments Board (Vulnerable to Stored XSS)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Saves comments directly to database and renders content unescaped.
              </p>
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Author Name</label>
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Comment Content (Payload)</label>
                <textarea
                  rows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCommentContent("<script>alert('XSS Exploit!')</script>")}
                  className="px-2 py-1 rounded bg-purple-950/60 border border-purple-800 text-purple-300 text-[10px] font-mono hover:bg-purple-900"
                >
                  &lt;script&gt;alert(...)&lt;/script&gt;
                </button>
                <button
                  type="button"
                  onClick={() => setCommentContent("<img src=x onerror=alert('Image-XSS')>")}
                  className="px-2 py-1 rounded bg-purple-950/60 border border-purple-800 text-purple-300 text-[10px] font-mono hover:bg-purple-900"
                >
                  &lt;img onerror=...&gt;
                </button>
              </div>

              <button
                type="submit"
                disabled={commentsLoading}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{commentsLoading ? "Submitting..." : "Post Training Comment"}</span>
              </button>
            </form>
          </div>

          {/* Stored Comments Feed */}
          <div className="p-6 rounded-xl bg-soc-card border border-soc-border flex flex-col justify-between">
            <div>
              <div className="border-b border-soc-border pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono">Stored Comments Feed</h3>
                <span className="text-xs text-slate-400 font-mono">{comments.length} Comments</span>
              </div>

              <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No comments found.
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="font-bold text-white">{c.author}</span>
                        <span className="text-slate-500">{c.created_at?.slice(11, 19)}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono bg-black/40 p-2 rounded border border-slate-800/80 break-words">
                        {c.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
