import React, { useEffect, useState } from "react";

const API_URL = "http://10.10.10.1:8000/api/ticketing/all/";
const MEDIA_URL = "http://10.10.10.1:8000";

const DashboardPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [elapsedTimes, setElapsedTimes] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setElapsedTimes((prevTimes) => {
        const newTimes = {};
        items.forEach((item) => {
          if (!item.created_at) return;
          const createdAt = new Date(item.created_at);
          const now = new Date();
          const elapsedSeconds = Math.floor((now - createdAt) / 1000);
          const hours = Math.floor(elapsedSeconds / 3600);
          const minutes = Math.floor((elapsedSeconds % 3600) / 60);
          const seconds = elapsedSeconds % 60;
          newTimes[item.id] = `${hours}h ${minutes}m ${seconds}s`;
        });
        return newTimes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [items]);

  const getPriorityBadge = (priority) => {
    const priorityMap = { high: "bg-danger", medium: "bg-warning", low: "bg-success" };
    const priorityText = typeof priority === "number"
      ? ["low", "medium", "high"][priority - 1] || "N/A"
      : priority?.toLowerCase() || "N/A";

    return <span className={`badge ${priorityMap[priorityText] || "bg-secondary"}`}>{priorityText}</span>;
  };

  return (
    <>
      <style>{`
        body { margin: 0; display: flex; flex-direction: column; min-height: 100vh; }
        header { position: sticky; top: 0; z-index: 10; background-color: #134D74; color: white; padding: 1rem; }
        main { flex: 1; padding: 1rem; }
        footer { background-color: #f8f9fa; padding: 1rem; text-align: center; }
        .card { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: none; }
      `}</style>

      <header className="mb-4">
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between">
          <div>
            <h1 className="fw-bold">Database Objects</h1>
            <p className="m-0">Responsive grid display of all items.</p>
          </div>
          <nav className="mt-3 mt-md-0">
            <a href="http://10.10.10.1:8000/admin/" className="btn btn-light me-2">Django Database</a>
            <a href="http://10.10.10.1/archive.html" className="btn btn-dark me-2">View Archived Tickets</a>
            <a href="http://10.10.10.1/charts.html" className="btn btn-primary me-2">View Charts</a>
            <a href="http://10.10.10.1/kanban.html" className="btn btn-primary">View Kanban Board</a>
          </nav>
        </div>
      </header>

      <main className="container">
        <section className="row">
          {error ? (
            <p className="text-danger text-center">⚠️ Unable to load data: {error}</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted">No data available.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="col-md-4 mb-4">
                <div className="card">
                  {item.file && (
                    <div className="card-body text-center">
                      <a href={`${MEDIA_URL}${item.file}`} target="_blank" rel="noreferrer" className="btn btn-primary">
                        Download File
                      </a>
                    </div>
                  )}
                  <div className="card-body">
                    {item.image && <img className="card-img-top mb-3" src={`${MEDIA_URL}${item.image}`} alt="Attachment" />}
                    <h5 className="card-title text-primary">Ticket #{item.id}</h5>
                    <p className="card-text"><strong>Issue:</strong> {item.issue || "N/A"}</p>
                    <p className="card-text"><strong>Priority:</strong> {getPriorityBadge(item.priority)}</p>
                    <p className="card-text"><strong>Status:</strong> {item.status || "N/A"}</p>
                    <p className="card-text"><strong>Time Elapsed:</strong> {elapsedTimes[item.id] || "—"}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      <footer>
        <small>&copy; 2025 Acme Corp. All rights reserved.</small>
      </footer>
    </>
  );
};

export default DashboardPage;
