import React, { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// If you keep these global or environment-based, adjust them accordingly:
const API_URL = "http://127.0.0.1:8000/api/ticketing/all/";
const DELETE_ENDPOINT = "http://127.0.0.1:8000/api/ticketing/"; 
// Expected DELETE format => http://10.10.10.1:8000/api/ticketing/<ticketId>/

// List of possible states for your tickets, in escalation order.
const escalationOrder = ["1", "2", "3", "archived"];

/**
 * Primary Kanban Board Component
 */
export default function TicketKanbanBoard() {
  // -------------------------------------------------------------------------
  // 1. Internal React States
  // -------------------------------------------------------------------------
  const [dbConnected, setDbConnected] = useState(false);
  const [allTickets, setAllTickets]   = useState([]);
  const [ticketTimers, setTicketTimers] = useState({}); // For storing setTimeout IDs
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  // Refs to DOM elements (equivalent to document.getElementById in plain JS).
  // Typically you'd create multiple smaller components instead, 
  // but this consolidates for demonstration:
  const dbStatusBarRef       = useRef(null);
  const activeCountRef       = useRef(null);
  const archivedCountRef     = useRef(null);
  const allTicketsTableBody  = useRef(null);

  // -------------------------------------------------------------------------
  // 2. Effects: On Load, check localStorage for "dbConnected"
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Initialize drag & drop listeners for columns
    initializeDragAndDrop();

    const wasConnected = localStorage.getItem("dbConnected") === "true";
    if (wasConnected) {
      // Reflect the persisted connection state
      setDbConnected(true);
      // Simulate a "fully connected" state in the progress bar
      if (dbStatusBarRef.current) {
        dbStatusBarRef.current.innerText = "Connected";
        dbStatusBarRef.current.classList.remove("bg-danger", "bg-info", "bg-warning");
        dbStatusBarRef.current.classList.add("bg-success");
        dbStatusBarRef.current.style.width = "100%";
      }
      console.log("Persisted connection state: Connected");
      fetchTickets();
    }
  }, []);

  // -------------------------------------------------------------------------
  // 3. Helper: Connect / Disconnect
  // -------------------------------------------------------------------------
  const connectDatabase = () => {
    if (!dbStatusBarRef.current) return;

    // Reset styles to "Connecting..."
    dbStatusBarRef.current.innerText = "Connecting...";
    dbStatusBarRef.current.classList.remove("bg-danger", "bg-success");
    dbStatusBarRef.current.classList.add("bg-info");
    dbStatusBarRef.current.style.width = "50%";

    // Simulate network handshake with setTimeout
    setTimeout(() => {
      setDbConnected(true);
      localStorage.setItem("dbConnected", "true");
      dbStatusBarRef.current.innerText = "Connected";
      dbStatusBarRef.current.classList.remove("bg-info");
      dbStatusBarRef.current.classList.add("bg-success");
      dbStatusBarRef.current.style.width = "100%";
      console.log("Database connection established.");
      fetchTickets();
    }, 2000);
  };

  const disconnectDatabase = () => {
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
      console.log("Database connection terminated.");
    }, 2000);
  };

  const clearAllTicketTimers = () => {
    for (const ticketId in ticketTimers) {
      clearTimeout(ticketTimers[ticketId]);
    }
    setTicketTimers({});
  };

  // -------------------------------------------------------------------------
  // 4. Fetch / Render Tickets
  // -------------------------------------------------------------------------
  const fetchTickets = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      // Construct a fresh copy with local status/time
      const updatedTickets = data.map((ticket, index) => {
        const localStatus = localStorage.getItem(`ticket-${ticket.id}`) || "1";
        return {
          ...ticket,
          startTime: Date.now(),
          status: localStatus,
        };
      });

      setAllTickets(updatedTickets);

      // Start the escalation timers with small offset
      updatedTickets.forEach((ticket, idx) => {
        setTimeout(() => {
          startEscalationTimer(ticket);
        }, idx * 1000);
      });

      console.log("Tickets successfully fetched from the database.");
    } catch (error) {
      console.error("Error fetching ticket data:", error);
    }
  };

  // Re-render counters whenever `allTickets` changes
  useEffect(() => {
    updateTicketCounters();
  }, [allTickets]);

  const updateTicketCounters = () => {
    if (!activeCountRef.current || !archivedCountRef.current) return;

    const activeCount = allTickets.filter(t => t.status !== "archived").length;
    const archivedCount = allTickets.filter(t => t.status === "archived").length;

    activeCountRef.current.textContent = activeCount.toString();
    archivedCountRef.current.textContent = archivedCount.toString();
  };

  // -------------------------------------------------------------------------
  // 5. Timer & Escalation Logic
  // -------------------------------------------------------------------------
  // Update the ticket timers visually every second
  useEffect(() => {
    const timerID = setInterval(updateTicketTimers, 1000);
    return () => clearInterval(timerID);
  }, [allTickets]);

  const updateTicketTimers = () => {
    const now = Date.now();
    allTickets.forEach(ticket => {
      const elapsedSeconds = Math.floor((now - (ticket.startTime ?? now)) / 1000);
      const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
      const seconds = String(elapsedSeconds % 60).padStart(2, "0");
      const cardElement = document.getElementById(`ticket-${ticket.id}`);
      if (cardElement) {
        const timerDiv = cardElement.querySelector(".ticket-timer");
        if (timerDiv) {
          timerDiv.innerText = `${minutes}:${seconds}`;
        }
      }
    });
  };

  const startEscalationTimer = (ticket) => {
    // If disconnected or the ticket is archived, do nothing
    if (!dbConnected || ticket.status === "archived") return;

    const escalationIndex = escalationOrder.indexOf(ticket.status);
    if (escalationIndex !== -1 && escalationIndex < escalationOrder.length - 1) {
      const nextStatus = escalationOrder[escalationIndex + 1];
      const randomTime = getRandomEscalationTime();

      setTicketTimers(prev => {
        const timerId = setTimeout(() => {
          updateTicketStatus(ticket.id, nextStatus);
          // Restart timer if not archived
          if (nextStatus !== "archived") {
            const updatedTicket = allTickets.find(t => t.id === ticket.id);
            if (updatedTicket) {
              startEscalationTimer(updatedTicket);
            }
          }
        }, randomTime);

        return { ...prev, [ticket.id]: timerId };
      });
    }
  };

  const getRandomEscalationTime = () => {
    // e.g. random between 10s -> 15s
    return Math.floor(Math.random() * 5000) + 10000;
  };

  const updateTicketStatus = (ticketId, newStatus) => {
    setAllTickets(prevTickets => {
      const updated = prevTickets.map(ticket => {
        if (ticket.id.toString() === ticketId.toString()) {
          localStorage.setItem(`ticket-${ticket.id}`, newStatus);
          return { ...ticket, status: newStatus };
        }
        return ticket;
      });
      return updated;
    });
  };

  // -------------------------------------------------------------------------
  // 6. Deletion Logic
  // -------------------------------------------------------------------------
  const removeTicketFromDB = async (ticketId) => {
    try {
      const response = await fetch(`${DELETE_ENDPOINT}${ticketId}/`, {
        method: "DELETE"
      });
      if (response.ok) {
        console.log(`Ticket #${ticketId} successfully deleted from DB.`);
      } else {
        console.error(`Failed to delete ticket #${ticketId}. Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting ticket #${ticketId}:`, error);
    }
  };

  const deleteSelectedTickets = async () => {
    const selectedIds = [];
    document.querySelectorAll(".ticket-checkbox:checked").forEach(cb => {
      selectedIds.push(cb.getAttribute("data-id"));
    });
    if (selectedIds.length === 0) {
      alert("No tickets selected for deletion.");
      return;
    }
    for (const ticketId of selectedIds) {
      await removeTicketFromDB(ticketId);
      removeTicketLocally(ticketId);
    }
  };

  const deleteAllTickets = async () => {
    if (!window.confirm("Are you sure you want to delete ALL tickets?")) return;
    // Copy to avoid mutation during iteration
    const currentTickets = [...allTickets];
    for (const ticket of currentTickets) {
      await removeTicketFromDB(ticket.id);
      removeTicketLocally(ticket.id);
    }
  };

  const removeTicketLocally = (ticketId) => {
    setAllTickets(prev => {
      return prev.filter(t => t.id.toString() !== ticketId.toString());
    });
    localStorage.removeItem(`ticket-${ticketId}`);
  };

  // -------------------------------------------------------------------------
  // 7. Selection / "Select All" Functionality
  // -------------------------------------------------------------------------
  const toggleSelectAll = () => {
    const newCheckedState = !selectAllChecked;
    setSelectAllChecked(newCheckedState);

    document.querySelectorAll(".ticket-checkbox").forEach(cb => {
      // Reflect the new "select all" state
      cb.checked = newCheckedState;
      const card = document.getElementById(`ticket-${cb.getAttribute("data-id")}`);
      if (card) {
        card.classList.toggle("selected", newCheckedState);
      }
    });
  };

  // -------------------------------------------------------------------------
  // 8. Drag & Drop Logic (Direct DOM Approach)
  // -------------------------------------------------------------------------
  const initializeDragAndDrop = () => {
    const columns = document.querySelectorAll(".kanban-column");
    columns.forEach(column => {
      column.addEventListener("dragover", handleDragOver);
      column.addEventListener("dragenter", handleDragEnter);
      column.addEventListener("dragleave", handleDragLeave);
      column.addEventListener("drop", handleDrop);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const columnElem = e.currentTarget;
    columnElem.classList.remove("drag-over");

    const ticketId = e.dataTransfer.getData("text/plain");
    const newStatus = columnElem.getAttribute("data-step");
    const columnBody = columnElem.querySelector(".column-body");
    if (columnBody && ticketId) {
      const ticketElement = document.getElementById(ticketId);
      if (ticketElement) {
        columnBody.appendChild(ticketElement);
        updateTicketStatus(ticketId, newStatus);
      }
    }
  };

  // -------------------------------------------------------------------------
  // 9. JSX Render: A single, large chunk of HTML with your styles + layout
  // -------------------------------------------------------------------------
  return (
    <div className="container-fluid" style={{ padding: "20px", backgroundColor: "#f2f7f9" }}>
      {/* Inline styles can also go into a separate CSS/SCSS file. */}
      <style>{`
        body {
          font-family: "Helvetica Neue", Arial, sans-serif;
          color: #555;
        }
        .sticky-header {
          background: linear-gradient(135deg, #a1c4fd, #c2e9fb);
          color: #333;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status-bar-container {
          margin: 20px 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
        }
        .status-bar {
          width: 300px;
          height: 25px;
        }
        .ticket-counter {
          width: 100%;
          max-width: 400px;
        }
        .kanban-board {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .kanban-column {
          flex: 1;
          min-width: 250px;
          background: #fff;
          border-radius: 8px;
          padding: 0;
          border: 1px solid #e0e0e0;
          min-height: 500px;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: background-color 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .kanban-column h3 {
          font-size: 1.1rem;
          margin: 0;
          padding: 15px;
          text-align: center;
          color: #3d3d3d;
          background-color: #f2f7f9;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .kanban-column h3:hover {
          background-color: #e6f0f7;
        }
        .column-body {
          padding: 15px;
          flex: 1;
          overflow-y: auto;
          transition: max-height 0.3s ease, padding 0.3s ease;
          position: relative;
        }
        .column-body.collapsed {
          max-height: 120px;
          overflow: hidden;
        }
        .column-body.collapsed::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: linear-gradient(to bottom, transparent, #fff);
          pointer-events: none;
        }
        .ticket-card {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 10px;
          cursor: grab;
          display: flex;
          flex-direction: column;
          transition: transform 0.5s ease, opacity 0.5s ease;
          position: relative;
        }
        .ticket-card.dragging {
          opacity: 0.5;
        }
        .kanban-column.drag-over {
          background: #f1f8e9;
          border-color: #dcedc8;
        }
        .ticket-thumbnail {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #ccc;
          margin-right: 8px;
        }
        @keyframes meltOff {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.1); }
        }
        .melt-off {
          animation: meltOff 1s forwards;
        }
        .ticket-timer {
          background: #333;
          color: #fff;
          font-size: 0.85rem;
          padding: 3px 6px;
          border-radius: 4px;
          position: absolute;
          top: 5px;
          right: 5px;
        }
        .ticket-card.selected {
          border: 2px solid #dc3545;
          background-color: #ffecec;
        }
        .table-dark thead th {
          border-color: #444;
        }
        .table-dark tbody tr:nth-of-type(odd) {
          background-color: rgba(255,255,255,0.05);
        }
      `}</style>

      {/* Header Section */}
      <header className="sticky-header text-center p-4 mb-3 bg-light rounded">
        <h1 className="mb-2">Ticket Kanban Board</h1>
        <p className="lead">Easily manage and track your tickets across different stages of progress.</p>

        {/* Select All Checkbox for multi-select deletion */}
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="checkbox"
            id="selectAllCheckbox"
            checked={selectAllChecked}
            onChange={toggleSelectAll}
          />
          <label className="form-check-label" htmlFor="selectAllCheckbox">
            Select All Tickets
          </label>
        </div>

        {/* Button to open ticket table modal */}
        <button
          type="button"
          className="btn btn-outline-secondary ms-3"
          data-bs-toggle="modal"
          data-bs-target="#ticketTableModal"
        >
          View Ticket Table
        </button>
      </header>

      {/* Database Connection & Ticket Counter Section */}
      <div className="status-bar-container mb-4 d-flex justify-content-between align-items-center">
        <div className="progress status-bar flex-grow-1 me-3" style={{ maxWidth: "300px" }}>
          <div
            id="dbStatusBar"
            className="progress-bar bg-danger"
            role="progressbar"
            ref={dbStatusBarRef}
            style={{ width: "0%" }}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            Disconnected
          </div>
        </div>

        <div className="d-flex gap-3">
          {/* Connect/Disconnect Buttons */}
          <button
            id="connectBtn"
            className="btn btn-primary"
            disabled={dbConnected}
            onClick={connectDatabase}
          >
            Connect
          </button>
          <button
            id="disconnectBtn"
            className="btn btn-secondary"
            disabled={!dbConnected}
            onClick={disconnectDatabase}
          >
            Disconnect
          </button>

          {/* Delete Buttons */}
          <button
            id="deleteSelectedBtn"
            className="btn btn-danger"
            onClick={deleteSelectedTickets}
          >
            Delete Selected
          </button>
          <button
            id="deleteAllBtn"
            className="btn btn-danger"
            onClick={deleteAllTickets}
          >
            Delete All
          </button>
        </div>
      </div>

      {/* Ticket Counter Section */}
      <div className="ticket-counter mb-4">
        <div className="table-responsive">
          <table className="table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>Active Tickets</th>
                <th>Archived Tickets</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td ref={activeCountRef}>0</td>
                <td ref={archivedCountRef}>0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* The Kanban Board */}
      <div className="kanban-board d-flex justify-content-between gap-3">
        {/* Column 1 */}
        <div className="kanban-column flex-fill bg-light rounded" data-step="1">
          <h3
            className="text-center"
            onClick={(e) => {
              const body = e.currentTarget.parentElement.querySelector(".column-body");
              body.classList.toggle("collapsed");
            }}
          >
            Ticket Received – Awaiting Initial Review
          </h3>
          <div className="column-body"></div>
        </div>

        {/* Column 2 */}
        <div className="kanban-column flex-fill bg-light rounded" data-step="2">
          <h3
            className="text-center"
            onClick={(e) => {
              const body = e.currentTarget.parentElement.querySelector(".column-body");
              body.classList.toggle("collapsed");
            }}
          >
            Under Analysis – Escalation in Progress
          </h3>
          <div className="column-body"></div>
        </div>

        {/* Column 3 */}
        <div className="kanban-column flex-fill bg-light rounded" data-step="3">
          <h3
            className="text-center"
            onClick={(e) => {
              const body = e.currentTarget.parentElement.querySelector(".column-body");
              body.classList.toggle("collapsed");
            }}
          >
            Actioning – In-depth Troubleshooting
          </h3>
          <div className="column-body"></div>
        </div>

        {/* Column 4: Archived */}
        <div className="kanban-column flex-fill bg-light rounded" data-step="archived">
          <h3
            className="text-center"
            onClick={(e) => {
              const body = e.currentTarget.parentElement.querySelector(".column-body");
              body.classList.toggle("collapsed");
            }}
          >
            Archived – Issue Resolved and Documented
          </h3>
          <div className="column-body"></div>
        </div>
      </div>

      {/* Modal for Viewing Ticket Table */}
      <div
        className="modal fade"
        id="ticketTableModal"
        tabIndex={-1}
        aria-labelledby="ticketTableModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content bg-dark text-white">
            <div className="modal-header">
              <h5 className="modal-title" id="ticketTableModalLabel">Ticket Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table table-dark table-striped" id="allTicketsTable">
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
                  <tbody ref={allTicketsTableBody}>
                    {/* We dynamically insert rows in `renderModalTableRows()` below */}
                    {allTickets.map(ticket => (
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
                            onClick={() => handleDeleteSingleTicket(ticket.id)}
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

      {/* Render the actual tickets into columns once in the DOM */}
      {allTickets.map((ticket) => {
        const column = document.querySelector(`.kanban-column[data-step="${ticket.status}"]`);
        // We rely on manual DOM insertion in "renderTickets()", but let's do
        // the effect version next:
        return null;
      })}

      {/* One more effect to "render" tickets in the Kanban columns whenever allTickets changes */}
      <RenderTickets allTickets={allTickets} />

    </div>
  );
}

/**
 * Subcomponent that manually places tickets into their respective columns in the DOM.
 * This is not the typical "React way" of doing drag & drop or dynamic DOM injection,
 * but replicates the code from your original script to keep changes minimal.
 */
function RenderTickets({ allTickets }) {
  useEffect(() => {
    // Clear each column's body
    document.querySelectorAll(".kanban-column").forEach(column => {
      const columnBody = column.querySelector(".column-body");
      if (columnBody) {
        columnBody.innerHTML = "";
      }
    });

    // Add each ticket's card to the appropriate column
    allTickets.forEach(ticket => {
      const column = document.querySelector(`.kanban-column[data-step="${ticket.status}"]`);
      if (column) {
        const columnBody = column.querySelector(".column-body");
        if (columnBody) {
          const card = createTicketCard(ticket);
          columnBody.appendChild(card);
        }
      }
    });
  }, [allTickets]);

  return null; // This component doesn't render visible elements; it manipulates the DOM
}

/**
 * Creates a card element in plain JS. This is also replicating
 * your original approach.
 */
function createTicketCard(ticket) {
  const card = document.createElement("div");
  card.className = "ticket-card";
  card.draggable = true;
  card.id = `ticket-${ticket.id}`;

  // Timer in the top-right corner
  const timerDiv = document.createElement("div");
  timerDiv.className = "ticket-timer";
  timerDiv.innerText = "00:00";
  card.appendChild(timerDiv);

  // Use a placeholder if no image is set
  const MEDIA_URL = "http://10.10.10.1:8000";
  const thumbnailSrc = ticket.image ? MEDIA_URL + ticket.image : "/static/default_thumbnail.jpg";

  const detailsDiv = document.createElement("div");
  detailsDiv.innerHTML = `
    <img src="${thumbnailSrc}" alt="Ticket Image" class="ticket-thumbnail">
    <small><b>Name:</b> ${ticket.name || "N/A"}</small><br>
    <small><b>Email:</b> ${ticket.email || "N/A"}</small><br>
    <strong>${ticket.title || "No Title"}</strong><br>
    <small><b>Issue:</b> ${ticket.issue || "N/A"}</small><br>
    <small><b>Priority:</b> ${ticket.priority || "N/A"}</small>
  `;
  card.appendChild(detailsDiv);

  // Checkbox for selection
  const checkDiv = document.createElement("div");
  checkDiv.className = "form-check ms-auto mt-2";
  checkDiv.innerHTML = `<input class="form-check-input ticket-checkbox" type="checkbox" data-id="${ticket.id}">`;
  card.appendChild(checkDiv);

  // DRAG EVENTS
  card.addEventListener("dragstart", (e) => {
    card.classList.add("dragging");
    e.dataTransfer.setData("text/plain", card.id);
  });
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  // Checkbox selection styling
  const checkbox = checkDiv.querySelector(".ticket-checkbox");
  checkbox.addEventListener("change", () => {
    card.classList.toggle("selected", checkbox.checked);
  });

  return card;
}

/**
 * Deleting a single ticket from the modal table requires direct references.
 * We can house it in the main file or place it in context. In a real app,
 * you'd unify all delete operations in the parent or via Redux, etc.
 */
async function handleDeleteSingleTicket(ticketId) {
  // A more "React-y" approach would pass this function via props, so we can
  // mutate state in the parent. For demonstration, we mirror your original script
  // with a global approach:
  try {
    const resp = await fetch(`${DELETE_ENDPOINT}${ticketId}/`, { method: "DELETE" });
    if (!resp.ok) {
      console.error(`Failed to delete ticket #${ticketId}. Status: ${resp.status}`);
    } else {
      console.log(`Ticket #${ticketId} successfully deleted from the database.`);
    }
  } catch (error) {
    console.error(`Error deleting ticket #${ticketId}:`, error);
  }
  // Also remove it from local state
  const event = new CustomEvent("removeTicketLocally", { detail: { ticketId } });
  window.dispatchEvent(event); 
  // In a pure React approach, you'd update state directly in the parent, 
  // but this is a quick hack if we keep the original structure. 
}

// Optionally, watch for "removeTicketLocally" event if you want to unify deletion logic
window.addEventListener("removeTicketLocally", (e) => {
  const { ticketId } = e.detail;
  const updatedTickets = JSON.parse(localStorage.getItem("allTickets") || "[]").filter(
    (t) => t.id.toString() !== ticketId.toString()
  );
  localStorage.setItem("allTickets", JSON.stringify(updatedTickets));
  const ticketElement = document.getElementById(`ticket-${ticketId}`);
  if (ticketElement) {
    ticketElement.remove();
  }
});

