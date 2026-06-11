import { useEffect, useState } from "react";
import "./App.css";
import TrafficChart from "./components/TrafficChart";

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

  const [logs, setLogs] = useState([]);

  const [theme, setTheme] = useState(getInitialTheme);

  const [filter, setFilter] = useState("ALL");

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [lastUpdated, setLastUpdated] = useState("");

  const [backendStatus, setBackendStatus] = useState(true);

  const [newLog, setNewLog] = useState({
    source_ip: "",
    destination_ip: "",
    protocol: "TCP",
    packet_size: "",
  });

  const isDarkMode = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch logs from backend
  const fetchLogs = () => {
  fetch("http://127.0.0.1:8000/logs")
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
  // Load logs when page loads
  useEffect(() => {
    fetchLogs();

    const interval = setInterval(() => {
        fetchLogs();
    }, 5000);   // refresh every 5 seconds

    return () => clearInterval(interval);
}, []);

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
    "ID",
    "Source IP",
    "Destination IP",
    "Protocol",
    "Packet Size",
    "Prediction",
    "Confidence",
  ];

  const rows = filteredLogs.map((log) => [
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

    try {
      const response = await fetch("http://127.0.0.1:8000/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_ip: newLog.source_ip,
          destination_ip: newLog.destination_ip,
          protocol: newLog.protocol,
          packet_size: Number(newLog.packet_size),
        }),
      });

      if (response.ok) {
        setNewLog({
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

  const toggleTheme = () => {
    setTheme((previousTheme) =>
      previousTheme === "dark" ? "light" : "dark"
    );
  };

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
                <td colSpan="7">No logs available for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;