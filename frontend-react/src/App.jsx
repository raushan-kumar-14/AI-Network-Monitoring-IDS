import { useEffect, useState } from "react";
import "./App.css";
import TrafficChart from "./components/TrafficChart";
import axios from "axios";

function App() {
  const getInitialTheme = () => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const savedTheme = window.localStorage.getItem("theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const getInitialSession = () => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedSession = window.localStorage.getItem("netsentinel-session");

    if (!savedSession) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(savedSession);

      if (
        parsedSession &&
        (parsedSession.role === "user" || parsedSession.role === "admin") &&
        typeof parsedSession.username === "string"
      ) {
        return parsedSession;
      }
    } catch (error) {
      return null;
    }

    return null;
  };

  const getInitialUsers = () => {
    if (typeof window === "undefined") {
      return [];
    }

    const savedUsers = window.localStorage.getItem("netsentinel-users");

    if (!savedUsers) {
      return [];
    }

    try {
      const parsedUsers = JSON.parse(savedUsers);

      if (Array.isArray(parsedUsers)) {
        return parsedUsers.filter(
          (user) =>
            user &&
            typeof user.username === "string" &&
            typeof user.password === "string"
        );
      }
    } catch (error) {
      return [];
    }

    return [];
  };

  const [logs, setLogs] = useState([]);

  const [theme, setTheme] = useState(getInitialTheme);

  const [session, setSession] = useState(getInitialSession);

  const [registeredUsers, setRegisteredUsers] = useState(getInitialUsers);

  const [loginRole, setLoginRole] = useState("user");

  const [authMode, setAuthMode] = useState("register");

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [authError, setAuthError] = useState("");

  const [filter, setFilter] = useState("ALL");

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [lastUpdated, setLastUpdated] = useState("");

  const [backendStatus, setBackendStatus] = useState(true);

  const [newLog, setNewLog] = useState({
    owner_username: "",
    source_ip: "",
    destination_ip: "",
    protocol: "TCP",
    packet_size: "",
  });
  const [captureRunning, setCaptureRunning] = useState(false);

  const [agentInstalled, setAgentInstalled] = useState(false);

  useEffect(() => {
  console.log("agentInstalled =", agentInstalled);
}, [agentInstalled]);

  const [agentStats, setAgentStats] = useState({
  running: false,
  packet_count: 0,
  uptime: 0,
});

  const isDarkMode = theme === "dark";
  
  // 👇 ADD THE FUNCTION HERE
const checkAgent = async () => {
  try {
    const response = await fetch("http://127.0.0.1:5050/stats");

    if (response.ok) {
      setAgentInstalled(true);
    } else {
      setAgentInstalled(false);
    }
  } catch (err) {
    setAgentInstalled(false);
  }
};
  
  useEffect(() => {
  if (!session) return;

  checkAgent();

  const interval = setInterval(() => {
    checkAgent();
  }, 5000);

  return () => clearInterval(interval);
}, [session]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(
        "netsentinel-session",
        JSON.stringify(session)
      );
    } else {
      window.localStorage.removeItem("netsentinel-session");
    }
  }, [session]);

  useEffect(() => {
    window.localStorage.setItem(
      "netsentinel-users",
      JSON.stringify(registeredUsers)
    );
  }, [registeredUsers]);

  useEffect(() => {
    setFilter("ALL");
    setSearchTerm("");
    setCurrentPage(1);
    setLogs([]);
    setLastUpdated("");
    setBackendStatus(true);
    setNewLog({
      owner_username: session && session.role === "user" ? session.username : "",
      source_ip: "",
      destination_ip: "",
      protocol: "TCP",
      packet_size: "",
    });
  }, [session]);

  // Fetch logs from backend
  const fetchLogs = () => {
    if (!session) {
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

const endpoint =
  session.role === "admin"
    ? `${API_URL}/logs`
    : `${API_URL}/logs?owner_username=${encodeURIComponent(
        session.username
      )}`;

    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        setLogs(data);
        setBackendStatus(true);
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch((error) => {
        console.error("Error fetching logs:", error);
        setBackendStatus(false);
      });
  };
  const fetchAgentStats = async () => {
  try {
    const response = await fetch("http://127.0.0.1:5050/stats");
    const data = await response.json();
    setAgentStats(data);
  } catch (error) {
    console.error("Failed to fetch agent stats:", error);
  }
};
  const startCapture = async () => {
    await axios.post(
        "http://127.0.0.1:5050/start",
        {
            username: session.username
        }
    );

    setCaptureRunning(true);
};

const stopCapture = async () => {
    await axios.post(
        "http://127.0.0.1:5050/stop"
    );

    setCaptureRunning(false);
};
  // Load logs when page loads
  useEffect(() => {
    if (!session) {
      return undefined;
    }

    fetchLogs();
    fetchAgentStats();

    const interval = setInterval(() => {
      fetchLogs();
      fetchAgentStats();
    }, 1000); // refresh every 1 second

    return () => clearInterval(interval);
  }, [session]);

  // Statistics
  const totalLogs = logs.length;
  const normalCount = logs.filter(
    (log) => log.prediction === "Normal"
  ).length;
  const suspiciousCount = logs.filter(
    (log) => log.prediction === "Suspicious"
  ).length;
  const scanCount = logs.filter(
    (log) => log.prediction === "Potential Scan"
  ).length;
  // Calculate percentages
  const getPercent = (count) =>
    totalLogs > 0 ? `${((count / totalLogs) * 100).toFixed(0)}%` : "0%";

  const totalPercent = totalLogs > 0 ? "100%" : "0%";
  const normalPercent = getPercent(normalCount);
  const suspiciousPercent = getPercent(suspiciousCount);
  const scanPercent = getPercent(scanCount);
  const totalAlerts = suspiciousCount + scanCount;

  // Filter + Search + Sort logs
const filteredLogs = logs
    .filter((log) => {
        const matchesFilter =
            filter === "ALL"
                ? true
                : log.prediction &&
                  log.prediction.toUpperCase() === filter;

        const matchesSearch =
            log.source_ip
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            log.destination_ip
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    })
    .sort((a, b) => b.id - a.id);

  const rowsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / rowsPerPage)
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    setCurrentPage((previousPage) =>
      Math.min(previousPage, totalPages)
    );
  }, [totalPages]);

  const exportToCSV = () => {
  const headers = [
    "Owner",
    "ID",
    "Source IP",
    "Destination IP",
    "Protocol",
    "Packet Size",
    "Prediction",
    "Confidence",
  ];

  const rows = filteredLogs.map((log) => [
    log.owner_username,
    log.id,
    log.source_ip,
    log.destination_ip,
    log.protocol,
    log.packet_size,
    log.prediction,
    log.confidence,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "network_logs.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
// Handle input changes
  const handleChange = (e) => {
    setNewLog({
      ...newLog,
      [e.target.name]: e.target.value,
    });
  };

  // Add new log
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session) {
      return;
    }

    const ownerUsername =
      session.role === "admin"
        ? newLog.owner_username.trim()
        : session.username;

    if (session.role === "admin" && !ownerUsername) {
      alert("Please enter a client username for this log.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner_username: ownerUsername,
          source_ip: newLog.source_ip,
          destination_ip: newLog.destination_ip,
          protocol: newLog.protocol,
          packet_size: Number(newLog.packet_size),
        }),
      });

      if (response.ok) {
        setNewLog({
          owner_username: session.role === "admin" ? "" : session.username,
          source_ip: "",
          destination_ip: "",
          protocol: "TCP",
          packet_size: "",
        });

        fetchLogs(); // refresh table
      } else {
        alert("Failed to add log.");
      }
    } catch (error) {
      console.error(error);
      alert("Backend connection error.");
    }
  };

  // Badge color
  const getPredictionStyle = (prediction) => {
    switch (prediction) {
      case "Normal":
        return {
          backgroundColor: "#198754",
          color: "white",
          padding: "4px 10px",
          borderRadius: "8px",
          fontWeight: "bold",
        };

      case "Suspicious":
        return {
          backgroundColor: "#dc3545",
          color: "white",
          padding: "4px 10px",
          borderRadius: "8px",
          fontWeight: "bold",
        };

      case "Potential Scan":
        return {
          backgroundColor: "#fd7e14",
          color: "white",
          padding: "4px 10px",
          borderRadius: "8px",
          fontWeight: "bold",
        };

      default:
        return {
          backgroundColor: "#6c757d",
          color: "white",
          padding: "4px 10px",
          borderRadius: "8px",
        };
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    const username = loginForm.username.trim();
    const password = loginForm.password.trim();

    if (!username || !password) {
      setAuthError("Enter a username and password.");
      return;
    }

    if (loginRole === "admin") {
      if (username !== "admin" || password !== "admin123") {
        setAuthError("Administrator login requires admin / admin123.");
        return;
      }

      setSession({
        role: "admin",
        username: "admin",
      });
      setAuthError("");
      return;
    }

    const matchedUser = registeredUsers.find(
      (user) => user.username === username && user.password === password
    );

    if (!matchedUser) {
      setAuthError("Account not found or password is incorrect. Sign up first.");
      return;
    }

    setSession({
      role: "user",
      username: matchedUser.username,
    });
    setAuthError("");
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();

    const username = signupForm.username.trim();
    const password = signupForm.password.trim();
    const confirmPassword = signupForm.confirmPassword.trim();

    if (!username || !password || !confirmPassword) {
      setAuthError("Fill in all signup fields.");
      return;
    }

    if (username.toLowerCase() === "admin") {
      setAuthError("Choose a different username. admin is reserved.");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    if (registeredUsers.some((user) => user.username === username)) {
      setAuthError("That username already exists.");
      return;
    }

    const nextUsers = [...registeredUsers, { username, password }];

    setRegisteredUsers(nextUsers);
    setSession({
      role: "user",
      username,
    });
    setLoginRole("user");
    setAuthMode("login");
    setLoginForm({
      username,
      password: "",
    });
    setSignupForm({
      username: "",
      password: "",
      confirmPassword: "",
    });
    setAuthError("");
  };

  const handleLogout = () => {
    setSession(null);
    setLoginForm({
      username: "",
      password: "",
    });
    setSignupForm({
      username: "",
      password: "",
      confirmPassword: "",
    });
    setLoginRole("user");
    setAuthMode("login");
    setAuthError("");
  };

  const toggleTheme = () => {
    setTheme((previousTheme) =>
      previousTheme === "dark" ? "light" : "dark"
    );
  };

  if (!session) {
    return (
      <div className="app-shell auth-shell">
        <div
          className="top-right-row"
          style={{
            marginBottom: "18px",
          }}
        >
          <div className="brand-badge" aria-label="Application brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-text">NetSentinel</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-h)",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-copy">
            <h1 className="auth-title">Secure Access</h1>
            <p className="auth-subtitle">
              Sign in as a user to see your own log dashboard, or create a new
              user account first. Administrators can review every client log.
            </p>
          </div>

          <div className="auth-role-switch" role="tablist" aria-label="Login type">
            <button
              type="button"
              className={loginRole === "user" ? "auth-role active" : "auth-role"}
              onClick={() => {
                setLoginRole("user");
                setAuthError("");
              }}
            >
              User Access
            </button>
            <button
              type="button"
              className={loginRole === "admin" ? "auth-role active" : "auth-role"}
              onClick={() => {
                setLoginRole("admin");
                setAuthError("");
              }}
            >
              Administrator Login
            </button>
          </div>

          {loginRole === "user" && (
            <button
              type="button"
              className="auth-switch-button"
              onClick={() => {
                setAuthMode((previousMode) =>
                  previousMode === "login" ? "register" : "login"
                );
                setAuthError("");
              }}
            >
              {authMode === "login"
                ? "Need a new account? Register as User"
                : "Already registered? Login as User"}
            </button>
          )}

          {loginRole === "admin" ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((previous) => ({
                      ...previous,
                      username: event.target.value,
                    }))
                  }
                  placeholder="admin"
                  autoComplete="username"
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                  placeholder="admin123"
                  autoComplete="current-password"
                />
              </label>

              {authError && <p className="auth-error">{authError}</p>}

              <button type="submit" className="auth-submit">
                Enter Administrator Dashboard
              </button>
            </form>
          ) : authMode === "login" ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((previous) => ({
                      ...previous,
                      username: event.target.value,
                    }))
                  }
                  placeholder="your username"
                  autoComplete="username"
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                  placeholder="your password"
                  autoComplete="current-password"
                />
              </label>

              {authError && <p className="auth-error">{authError}</p>}

              <button type="submit" className="auth-submit">
                Login as User
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  value={signupForm.username}
                  onChange={(event) =>
                    setSignupForm((previous) => ({
                      ...previous,
                      username: event.target.value,
                    }))
                  }
                  placeholder="choose a username"
                  autoComplete="username"
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(event) =>
                    setSignupForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                  placeholder="create a password"
                  autoComplete="new-password"
                />
              </label>

              <label className="auth-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(event) =>
                    setSignupForm((previous) => ({
                      ...previous,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="repeat your password"
                  autoComplete="new-password"
                />
              </label>

              {authError && <p className="auth-error">{authError}</p>}

              <button type="submit" className="auth-submit">
                Register as User
              </button>
            </form>
          )}

          <p className="auth-note">
            Demo admin credentials: <strong>admin / admin123</strong>. User
            accounts are stored in your browser after registration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div
        className="top-right-row"
        style={{
          marginBottom: "10px",
        }}
      >
        <div className="brand-badge" aria-label="Application brand">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-text">NetSentinel</span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
          style={{
            padding: "10px 16px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text-h)",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "10px 16px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-h)",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>

      <h1
        className="app-title"
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        AI Network Monitoring IDS
      </h1>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
    {captureRunning ? (
        <button onClick={stopCapture}>
            🔴 Stop Live Capture
        </button>
    ) : (
        agentInstalled ? (
    <button onClick={startCapture}>
      🟢 Start Live Capture
    </button>
  ) : (
    <button
      onClick={() =>
        window.open(
          "/downloads/AgentInstaller.exe",
          "_blank"
        )
      }
    >
      ⬇ Download Windows Agent
    </button>
  )
)}
</div>


<div
  style={{
    marginTop: "20px",
    marginBottom: "20px",
    padding: "12px",
    background: "#1f2937",
    borderRadius: "10px",
    color: "white",
    display: "inline-block",
    minWidth: "260px",
  }}
>
  <div>📦 Packets Captured: {agentStats.packet_count}</div>
  <div>⏱ Uptime: {agentStats.uptime} sec</div>
</div>


      <p
        className="dashboard-subtitle"
        style={{
          textAlign: "center",
          marginTop: "-18px",
          marginBottom: "18px",
          color: "var(--text-muted)",
        }}
      >
        {session.role === "admin"
          ? "Administrator Dashboard - all client logs"
          : `User Dashboard - ${session.username}`}
      </p>

      <p
        style={{
          textAlign: "center",
          color: backendStatus ? "var(--success)" : "var(--danger)",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        {backendStatus ? "🟢 Backend Connected" : "🔴 Backend Offline"}
      </p>

      {totalAlerts > 0 && (
        <div
          className="app-panel"
          style={{
            background: "var(--danger)",
            color: "white",
            padding: "12px",
            margin: "20px auto",
            width: "100%",
            textAlign: "center",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          🚨 ALERT: {totalAlerts} Suspicious Network Event
          {totalAlerts > 1 ? "s" : ""} Detected!
        </div>
      )}

      <div className="dashboard-cards app-panel">
        <div className="dashboard-card">
          <h3>📊 Total Logs</h3>
          <h1>
            <span className="stat-count">{totalLogs}</span>{" "}
            <span className="stat-percent">({totalPercent})</span>
          </h1>
        </div>

        <div className="dashboard-card normal-card">
          <h3>🟢 Normal Traffic</h3>
          <h1>
            <span className="stat-count">{normalCount}</span>{" "}
            <span className="stat-percent">({normalPercent})</span>
          </h1>
        </div>

        <div className="dashboard-card suspicious-card">
          <h3>🔴 Suspicious Traffic</h3>
          <h1>
            <span className="stat-count">{suspiciousCount}</span>{" "}
            <span className="stat-percent">({suspiciousPercent})</span>
          </h1>
        </div>

        <div className="dashboard-card scan-card">
          <h3>🟠 Potential Scans</h3>
          <h1>
            <span className="stat-count">{scanCount}</span>{" "}
            <span className="stat-percent">({scanPercent})</span>
          </h1>
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: "15px",
          marginBottom: "10px",
          color: "var(--text-muted)",
          fontSize: "14px",
        }}
      >
        Last Updated: {lastUpdated || "Loading..."}
      </p>

      <div
        className="traffic-chart-shell"
        style={{
          margin: "30px auto",
          background: "var(--surface)",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "var(--shadow)",
          minHeight: "420px",
        }}
      >
        <TrafficChart
          normalCount={normalCount}
          suspiciousCount={suspiciousCount}
          scanCount={scanCount}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search by Source or Destination IP"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "350px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text-h)",
            fontSize: "15px",
          }}
        />
      </div>

      <h2 style={{ textAlign: "center" }}>Add Network Log</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        {session.role === "admin" && (
          <input
            type="text"
            name="owner_username"
            placeholder="Client Username"
            value={newLog.owner_username}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="text"
          name="source_ip"
          placeholder="Source IP"
          value={newLog.source_ip}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="destination_ip"
          placeholder="Destination IP"
          value={newLog.destination_ip}
          onChange={handleChange}
          required
        />

        <select name="protocol" value={newLog.protocol} onChange={handleChange}>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="ICMP">ICMP</option>
        </select>

        <input
          type="number"
          name="packet_size"
          placeholder="Packet Size"
          value={newLog.packet_size}
          onChange={handleChange}
          required
        />

        <button type="submit">Add Log</button>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => setFilter("ALL")}>All</button>

        <button onClick={() => setFilter("NORMAL")}>Normal</button>

        <button onClick={() => setFilter("SUSPICIOUS")}>Suspicious</button>

        <button onClick={() => setFilter("POTENTIAL SCAN")}>Potential Scan</button>
      </div>

      <h2 style={{ textAlign: "center" }}>Network Logs</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <span style={{ color: "#bbbbbb", fontWeight: "bold" }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "15px",
        }}
      >
        <button
          onClick={exportToCSV}
          style={{
            padding: "10px 20px",
            background: "var(--info)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          📥 Export Logs (CSV)
        </button>
      </div>

      <div
        className="logs-table-shell"
        style={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <table
          className="logs-table"
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
          }}
        >
          <thead>
            <tr>
              <th>Owner</th>
              <th>ID</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Packet Size</th>
              <th>Prediction</th>
              <th>Confidence</th>
            </tr>
          </thead>

          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.owner_username || session.username}</td>
                <td>{log.id}</td>
                <td>{log.source_ip}</td>
                <td>{log.destination_ip}</td>
                <td>{log.protocol}</td>
                <td>{log.packet_size}</td>

                <td>
                  <span style={getPredictionStyle(log.prediction)}>
                    {log.prediction}
                  </span>
                </td>

                <td>{log.confidence}</td>
              </tr>
            ))}

            {paginatedLogs.length === 0 && (
              <tr>
                <td colSpan="8">No logs available for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;