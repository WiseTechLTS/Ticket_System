import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const HomePage = () => {
  // Retrieve the logged in user and JWT token
  const [user, token] = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // State for managing escalation challenge modal
  const [escalationChallenge, setEscalationChallenge] = useState(null);

  // API endpoint and media base URL
  const API_URL = "http://10.10.10.1:8000/api/ticketing/";
  const MEDIA_BASE_URL = "http://10.10.10.1:8000";

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${API_URL}all/`, {
          headers: { Authorization: "Bearer " + token },
        });
        setTickets(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data || err.message);
        setLoading(false);
      }
    };

    if (token) fetchTickets();
  }, [token, API_URL]);

  // Handler for launching the escalation challenge
  const handleEscalate = (ticketId) => {
    // Generate a simple math challenge
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setEscalationChallenge({ ticketId, a, b, correct: a + b, userAnswer: "" });
  };

  // Handle change for the escalation challenge input
  const handleChallengeChange = (e) => {
    setEscalationChallenge({
      ...escalationChallenge,
      userAnswer: e.target.value,
    });
  };

  // Submit escalation challenge and update ticket if correct
  const submitEscalation = async () => {
    if (parseInt(escalationChallenge.userAnswer, 10) === escalationChallenge.correct) {
      try {
        // For demonstration, update ticket locally. In a real app, call your API to update the ticket.
        const updatedTickets = tickets.map((ticket) =>
          ticket.id === escalationChallenge.ticketId ? { ...ticket, priority: "2" } : ticket
        );
        setTickets(updatedTickets);
        setEscalationChallenge(null);
      } catch (error) {
        console.error("Error updating ticket escalation:", error);
      }
    } else {
      alert("Incorrect answer. Please try again.");
    }
  };

  if (loading) return <div className="container">Loading tickets...</div>;
  if (error) return <div className="container text-danger">Error: {error}</div>;

  return (
    <div className="container my-4">
      <h1 className="mb-4">Tickets for {user.username}</h1>
      <div className="row">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <div key={ticket.id} className="col-12 col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                {ticket.screenshot && (
                  <img
                    src={
                      ticket.screenshot.startsWith("http")
                        ? ticket.screenshot
                        : MEDIA_BASE_URL + ticket.screenshot
                    }
                    className="card-img-top"
                    alt="Ticket Screenshot"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{ticket.name}</h5>
                  <p className="card-text">
                    <strong>Email:</strong> {ticket.email}
                  </p>
                  <p className="card-text">
                    <strong>Phone:</strong> {ticket.phone}
                  </p>
                  <p className="card-text">
                    <strong>Issue:</strong> {ticket.issue}
                  </p>
                  <p className="card-text">
                    <strong>Priority:</strong> {ticket.priority}
                  </p>
                  <p className="card-text mt-auto">
                    <small className="text-muted">
                      Submitted: {new Date(ticket.created_at).toLocaleString()}
                    </small>
                  </p>
                  {/* Show escalation button only if ticket is not escalated (assume priority "0" means unsolved) */}
                  {ticket.priority === "0" && (
                    <button
                      className="btn btn-sm btn-warning mt-2"
                      onClick={() => handleEscalate(ticket.id)}
                    >
                      Escalate Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No tickets found.</p>
        )}
      </div>

      {/* Escalation Challenge Modal */}
      {escalationChallenge && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Escalation Challenge</h5>
                <button
                  className="btn-close"
                  onClick={() => setEscalationChallenge(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Solve: {escalationChallenge.a} + {escalationChallenge.b} = ?
                </p>
                <input
                  type="number"
                  className="form-control"
                  value={escalationChallenge.userAnswer || ""}
                  onChange={handleChallengeChange}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={submitEscalation}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
