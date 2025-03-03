import React, { useEffect, useState, useRef } from "react";
import useAuth from "../../hooks/useAuth";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

/**
 * Primary component that fetches tickets and renders:
 *  - The existing "table view" of tickets
 *  - The optional "TicketKanbanBoard" component
 */
const HomePage = () => {
  const [user, token] = useAuth();
  const [tickets, setTickets] = useState([]);

  // Fetch tickets once the token is available
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Make sure to include a space between "Bearer" and token
        const response = await axios.get("http://10.10.10.1:8000/api/tickets/all/", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });
        setTickets(response.data);
      } catch (error) {
        console.error(error.response?.data || error);
      }
    };
    if (token) {
      fetchTickets();
    }
  }, [token]);

  return (
    <div className="container-fluid align-items-center">
      <h1>Home Page for {user.username}!</h1>

      {/* 1) Existing Table View */}
      <div className="table-responsive my-3">
        <table className="table table-dark table-striped align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Issue</th>
              <th>Sub-Department</th>
              <th>Main Department</th>
              <th>Priority Level</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.title}</td>
                <td>{ticket.issue}</td>
                <td>{ticket.sub_department_name}</td>
                <td>{ticket.main_department_name}</td>
                <td>{ticket.priority_level_description}</td>
                <td>{ticket.status}</td>
                <td>{new Date(ticket.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2) Optional Kanban Board */}
      <div className="my-4">
        <TicketKanbanBoard />
      </div>
    </div>
  );
};

export default HomePage;

/* --------------------------------------------------------------------------
   Below is a Kanban Board subcomponent that shows how you might integrate a
   full drag-and-drop flow (with localStorage-based "dbConnected" state, timers,
   etc.) in the same file as the HomePage. This portion is mostly derived from
   your earlier HTML/JS snippet, but wrapped in React. If you wish to share the
   same 'tickets' data from HomePage, you can pass them as props and remove the
   internal fetch() logic. 
   -------------------------------------------------------------------------- */

function TicketKanbanBoard() {
  // Recreating the logic from your Kanban snippet:
  const [dbConnected, setDbConnected] = useState(false);
  const [allTickets, setAllTickets] = useState([]);
  const [ticketTimers, setTicketTimers] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // Refs for progress bar or table bodies
  const dbStatusBarRef = useRef(null);
  const allTicketsTableBodyRef = useRef(null);

  // For the counters
  const [activeCount, setActiveCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  // API Constants (example)
  const API_URL = "http://10.10.10.1:8000/api/ticketing/all/";
  const DELETE_ENDPOINT = "http://10.10.10.1:8000/api/ticketing/";
  const escalationOrder = ["1", "2", "3", "archived"];

  /* On initial load, re-check localStorage for connectivity state */
  useEffect(() => {
    initializeDragAndDrop(); // Attach DnD events to columns
    const wasConnected = localStorage.getItem("dbConnected") === "true";
    if (wasConnected) {
      setDbConnected(true);
      if (dbStatusBarRef.current) {
        dbStatusBarRef.current.innerText = "Connected";
        dbStatusBarRef.current.classList.remove("bg-danger", "bg-info", "bg-warning");
        dbStatusBarRef.current.classList.add("bg-success");
        dbStatusBarRef.current.style.width = "100%";
      }
      fetchTickets();
    }
  }, []);

  // Recompute counters whenever allTickets changes
  useEffect(() => {
    const active = allTickets.filter((t) => t.status !== "archived").length;
    const archived = allTickets.filter((t) => t.status === "archived").length;
    setActiveCount(active);
    setArchivedCount(archived);

    // Also refresh the modal table UI
    if (allTicketsTableBodyRef.current) {
      // Imperative DOM population if needed
      // but we can just re-render in JSX directly
    }
  }, [allTickets]);

  // Periodically update the local timers
  useEffect(() => {
    const timerId = setInterval(updateTicketTimers, 1000);
    return () => clearInterval(timerId);
  }, [allTickets]);

  // --------------------------------------------------------------------------
  // 1. Database Connection / Disconnection
  // --------------------------------------------------------------------------
  function connectDatabase() {
    if (!dbStatusBarRef.current) return;
    dbStatusBarRef.current.innerText = "Connecting...";
    dbStatusBarRef.current.classList.remove("bg-danger", "bg-success");
    dbStatusBarRef.current.classList.add("bg-info");
    dbStatusBarRef.current.style.width = "50%";

    setTimeout(() => {
      setDbConnected(true);
      localStorage.setItem("dbConnected", "true");
      dbStatusBarRef.current.innerText = "Connected";
      dbStatusBarRef.current.classList.remove("bg-info");
      dbStatusBarRef.current.classList.add("bg-success");
      dbStatusBarRef.current.style.width = "100%";
      fetchTickets();
    }, 2000);
  }

  function disconnectDatabase() {
    if (!dbStatusBarRef.current) return;
    dbStatusBarRef.current.innerText = "Disconnecting...";
    dbStatusBarRef.current.classList.remove("bg-success", "bg-info");
    dbStatusBarRef.current.classList.add("bg-warning");
    dbStatusBarRef.current.style.width = "50%";
    clearAllTicketTimers();

    setTimeout(() => {
      setDbConnected(false);
      localStorage.setItem("dbConnected", "false");
      dbStatusBarRef.current.innerText = "Disconnected";
      dbStatusBarRef.current.classList.remove("bg-warning");
      dbStatusBarRef.current.classList.add("bg-danger");
      dbStatusBarRef.current.style.width = "0%";
    }, 2000);
  }

  function clearAllTicketTimers() {
    for (const ticketId in ticketTimers) {
      clearTimeout(ticketTimers[ticketId]);
    }
    setTicketTimers({});
  }

  // --------------------------------------------------------------------------
  // 2. Fetch & Render Tickets
  // --------------------------------------------------------------------------
  async function fetchTickets() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      // Initialize local status + startTime
      const updatedTickets = data.map((ticket, idx) => {
        const storedStatus = localStorage.getItem(`ticket-${ticket.id}`) || "1";
        return { ...ticket, status: storedStatus, startTime: Date.now() };
      });
      setAllTickets(updatedTickets);

      // Kick off escalation timers
      updatedTickets.forEach((ticket, index) => {
        setTimeout(() => {
          startEscalationTimer(ticket);
        }, index * 1000);
      });
    } catch (error) {
      console.error("Error fetching ticket data:", error);
    }
  }

  function updateTicketTimers() {
    const now = Date.now();
    allTickets.forEach((ticket) => {
      const elapsed = Math.floor((now - (ticket.startTime || now)) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const seconds = String(elapsed % 60).padStart(2, "0");
      // Manually update DOM if desired:
      const card = document.getElementById(`ticket-${ticket.id}`);
      if (card) {
        const timerDiv = card.querySelector(".ticket-timer");
        if (timerDiv) {
          timerDiv.innerText = `${minutes}:${seconds}`;
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. Escalation Logic
  // --------------------------------------------------------------------------
  function startEscalationTimer(ticket) {
    if (!dbConnected || ticket.status === "archived") return;
    const index = escalationOrder.indexOf(ticket.status);
    if (index >= 0 && index < escalationOrder.length - 1) {
      const nextStatus = escalationOrder[index + 1];
      const randomTime = getRandomEscalationTime();

      setTicketTimers((prev) => {
        const timerId = setTimeout(() => {
          updateTicketStatus(ticket.id, nextStatus);
          // If not archived, keep escalating
          if (nextStatus !== "archived") {
            const freshTicket = allTickets.find((t) => t.id === ticket.id);
            if (freshTicket) startEscalationTimer(freshTicket);
          }
        }, randomTime);
        return { ...prev, [ticket.id]: timerId };
      });
    }
  }

  function getRandomEscalationTime() {
    return Math.floor(Math.random() * 5000) + 10000; // e.g., 10–15 seconds
  }

  function updateTicketStatus(ticketId, newStatus) {
    setAllTickets((prev) => {
      return prev.map((t) => {
        if (t.id.toString() === ticketId.toString()) {
          localStorage.setItem(`ticket-${t.id}`, newStatus);
          return { ...t, status: newStatus };
        }
        return t;
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. Deletion Logic
  // --------------------------------------------------------------------------
  async function removeTicketFromDB(ticketId) {
    try {
      const resp = await fetch(`${DELETE_ENDPOINT}${ticketId}/`, { method: "DELETE" });
      if (resp.ok) console.log(`Ticket #${ticketId} deleted from DB.`);
      else console.error(`Failed to delete ticket #${ticketId}. Status: ${resp.status}`);
    } catch (error) {
      console.error(`Error deleting ticket #${ticketId}:`, error);
    }
  }

  async function deleteSelectedTickets() {
    const selected = Array.from(document.querySelectorAll(".ticket-checkbox:checked"));
    if (selected.length === 0) {
      alert("No tickets selected for deletion.");
      return;
    }
    for (const cb of selected) {
      const ticketId = cb.dataset.id;
      await removeTicketFromDB(ticketId);
      removeTicketLocally(ticketId);
    }
  }

  async function deleteAllTickets() {
    if (!window.confirm("Are you sure you want to delete ALL tickets?")) return;
    const snapshot = [...allTickets];
    for (const t of snapshot) {
      await removeTicketFromDB(t.id);
      removeTicketLocally(t.id);
    }
  }

  function removeTicketLocally(ticketId) {
    setAllTickets((prev) => prev.filter((t) => t.id.toString() !== ticketId.toString()));
    localStorage.removeItem(`ticket-${ticketId}`);
  }

  // --------------------------------------------------------------------------
  // 5. Selection / "Select All" Checkboxes
  // --------------------------------------------------------------------------
  function toggleSelectAll() {
    const newVal = !selectAll;
    setSelectAll(newVal);
    const checkboxes = document.querySelectorAll(".ticket-checkbox");
    checkboxes.forEach((box) => {
      box.checked = newVal;
      const card = document.getElementById(`ticket-${box.dataset.id}`);
      if (card) {
        card.classList.toggle("selected", newVal);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. Drag & Drop Logic
  // --------------------------------------------------------------------------
  function initializeDragAndDrop() {
    const columns = document.querySelectorAll(".kanban-column");
    columns.forEach((col) => {
      col.addEventListener("dragover", handleDragOver);
      col.addEventListener("dragenter", handleDragEnter);
      col.addEventListener("dragleave", handleDragLeave);
      col.addEventListener("drop", handleDrop);
    });
  }
  function handleDragOver(e) { e.preventDefault(); }
  function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }
  function handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }
  function handleDrop(e) {
    e.preventDefault();
    const col = e.currentTarget;
    col.classList.remove("drag-over");
    const ticketId = e.dataTransfer.getData("text/plain");
    const newStatus = col.getAttribute("data-step");
    const columnBody = col.querySelector(".column-body");
    if (columnBody) {
      const ticketElem = document.getElementById(ticketId);
      if (ticketElem) {
        columnBody.appendChild(ticketElem);
        updateTicketStatus(ticketId, newStatus);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 7. Render the Kanban Layout in JSX
  // --------------------------------------------------------------------------
  return (
    <div
      className="container-fluid"
      style={{ backgroundColor: "#f2f7f9", padding: "20px", borderRadius: "8px" }}
    >
      <h2 className="text-center mb-4">Ticket Kanban Board</h2>

      {/* Database Status & Controls */}
      <div className="status-bar-container mb-3 d-flex flex-wrap align-items-center gap-3">
        <div
          className="progress"
          style={{ width: "300px", height: "25px", marginRight: "15px" }}
        >
          <div
            ref={dbStatusBarRef}
            className="progress-bar bg-danger"
            role="progressbar"
            style={{ width: "0%" }}
          >
            Disconnected
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={connectDatabase} disabled={dbConnected}>
            Connect
          </button>
          <button className="btn btn-secondary" onClick={disconnectDatabase} disabled={!dbConnected}>
            Disconnect
          </button>
        </div>
        <button className="btn btn-danger" onClick={deleteSelectedTickets}>Delete Selected</button>
        <button className="btn btn-danger" onClick={deleteAllTickets}>Delete All</button>
      </div>

      {/* Ticket Counters */}
      <div className="table-responsive mb-3" style={{ maxWidth: "400px" }}>
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>Active Tickets</th>
              <th>Archived Tickets</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{activeCount}</td>
              <td>{archivedCount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Select All Checkbox */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id="selectAllTickets"
          checked={selectAll}
          onChange={toggleSelectAll}
        />
        <label className="form-check-label" htmlFor="selectAllTickets">
          Select All Tickets
        </label>
      </div>

      {/* Kanban Columns */}
      <div className="kanban-board d-flex gap-3" style={{ minHeight: "400px" }}>
        {/* Column 1 */}
        <div className="kanban-column flex-fill bg-white" data-step="1">
          <h3
            style={headerStyle}
            onClick={(e) =>
              e.currentTarget.parentElement.querySelector(".column-body")?.classList.toggle("collapsed")
            }
          >
            Ticket Received – Awaiting Initial Review
          </h3>
          <div className="column-body" style={{ padding: "15px", overflowY: "auto" }}></div>
        </div>

        {/* Column 2 */}
        <div className="kanban-column flex-fill bg-white" data-step="2">
          <h3
            style={headerStyle}
            onClick={(e) =>
              e.currentTarget.parentElement.querySelector(".column-body")?.classList.toggle("collapsed")
            }
          >
            Under Analysis – Escalation in Progress
          </h3>
          <div className="column-body" style={{ padding: "15px", overflowY: "auto" }}></div>
        </div>

        {/* Column 3 */}
        <div className="kanban-column flex-fill bg-white" data-step="3">
          <h3
            style={headerStyle}
            onClick={(e) =>
              e.currentTarget.parentElement.querySelector(".column-body")?.classList.toggle("collapsed")
            }
          >
            Actioning – In-depth Troubleshooting
          </h3>
          <div className="column-body" style={{ padding: "15px", overflowY: "auto" }}></div>
        </div>

        {/* Column 4: Archived */}
        <div className="kanban-column flex-fill bg-white" data-step="archived">
          <h3
            style={headerStyle}
            onClick={(e) =>
              e.currentTarget.parentElement.querySelector(".column-body")?.classList.toggle("collapsed")
            }
          >
            Archived – Issue Resolved and Documented
          </h3>
          <div className="column-body" style={{ padding: "15px", overflowY: "auto" }}></div>
        </div>
      </div>

      {/* Modal for Viewing Ticket Table */}
      <div className="modal fade" id="ticketTableModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content bg-dark text-white">
            <div className="modal-header">
              <h5 className="modal-title">Ticket Details</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Issue</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody ref={allTicketsTableBodyRef}>
                    {allTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.id}</td>
                        <td>{ticket.name || "N/A"}</td>
                        <td>{ticket.email || "N/A"}</td>
                        <td>{ticket.issue || "N/A"}</td>
                        <td>{ticket.priority}</td>
                        <td>{ticket.status}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteSingleTicket(ticket.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Imperative "render" of tickets into columns once in the DOM */}
      <RenderKanbanCards tickets={allTickets} />
    </div>
  );

  // Single-ticket deletion (from the modal)
  async function deleteSingleTicket(ticketId) {
    await removeTicketFromDB(ticketId);
    removeTicketLocally(ticketId);
  }
}

/**
 * Imperative injection: takes each ticket, creates a DOM card, and places
 * it in the correct Kanban column. This replicates your original approach
 * in a minimal React wrapper.
 */
function RenderKanbanCards({ tickets }) {
  useEffect(() => {
    // 1) Clear out existing columns
    document.querySelectorAll(".kanban-column .column-body").forEach((body) => {
      body.innerHTML = "";
    });

    // 2) Insert each ticket
    tickets.forEach((ticket) => {
      const column = document.querySelector(`.kanban-column[data-step="${ticket.status}"]`);
      if (column) {
        const body = column.querySelector(".column-body");
        if (body) {
          const card = createTicketCard(ticket);
          body.appendChild(card);
        }
      }
    });
  }, [tickets]);

  return null;
}

/** Helper to create a ticket card as raw DOM elements */
function createTicketCard(ticket) {
  const card = document.createElement("div");
  card.className = "ticket-card";
  card.draggable = true;
  card.id = `ticket-${ticket.id}`;

  // Timer
  const timerDiv = document.createElement("div");
  timerDiv.className = "ticket-timer";
  timerDiv.innerText = "00:00";
  card.appendChild(timerDiv);

  // Insert basic details
  const MEDIA_URL = "http://10.10.10.1:8000";
  const thumbnailSrc = ticket.image ? MEDIA_URL + ticket.image : "/static/default_thumbnail.jpg";

  const infoDiv = document.createElement("div");
  infoDiv.innerHTML = `
    <img src="${thumbnailSrc}" alt="Ticket Image" class="ticket-thumbnail">
    <small><b>Name:</b> ${ticket.name || "N/A"}</small><br>
    <small><b>Email:</b> ${ticket.email || "N/A"}</small><br>
    <strong>${ticket.title || "No Title"}</strong><br>
    <small><b>Issue:</b> ${ticket.issue || "N/A"}</small><br>
    <small><b>Priority:</b> ${ticket.priority || "N/A"}</small>
  `;
  card.appendChild(infoDiv);

  // Selection checkbox
  const checkDiv = document.createElement("div");
  checkDiv.className = "form-check ms-auto mt-2";
  checkDiv.innerHTML = `<input class="form-check-input ticket-checkbox" type="checkbox" data-id="${ticket.id}">`;
  card.appendChild(checkDiv);

  // Drag events
  card.addEventListener("dragstart", (e) => {
    card.classList.add("dragging");
    e.dataTransfer.setData("text/plain", card.id);
  });
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  // Toggle .selected for styling if checkbox is checked
  const checkbox = checkDiv.querySelector(".ticket-checkbox");
  checkbox.addEventListener("change", () => {
    card.classList.toggle("selected", checkbox.checked);
  });

  return card;
}

/** Simple inline style for column headers */
const headerStyle = {
  fontSize: "1rem",
  margin: 0,
  padding: "15px",
  textAlign: "center",
  color: "#3d3d3d",
  backgroundColor: "#f2f7f9",
  borderBottom: "1px solid #e0e0e0",
  cursor: "pointer",
};

