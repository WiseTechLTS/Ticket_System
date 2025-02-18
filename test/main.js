/**************************************************
 * main.js - Centralized JavaScript for the
 * Unified IT Ticket System.
 *
 * This file handles dark mode toggling, form submissions,
 * ticket rendering, escalation, and all other interactions.
 *
 * Comments are added in simple language to explain every step.
 **************************************************/

// Global variable for the current user.
// This tells our system who you are.
const currentUser = "UserA"; // Change to "AdminUser" to simulate admin actions.

// Wait until the page (DOM) is fully loaded before running our code.
document.addEventListener('DOMContentLoaded', () => {
  console.log('[INFO] Application initialized.');

  /* -------------------------------
   * Global: Dark Mode Toggle
   * When you click the toggle button, the site switches between dark and light mode.
   * It's like turning a light switch on and off.
   ------------------------------- */
  const toggleThemeBtn = document.getElementById('toggleTheme');
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      if (document.body.classList.contains('light-mode')) {
        document.body.style.backgroundColor = '#f5f5f5';
        document.body.style.color = '#333';
        console.log('[INFO] Switched to light mode.');
      } else {
        document.body.style.backgroundColor = '#121212';
        document.body.style.color = '#e0e0e0';
        console.log('[INFO] Switched to dark mode.');
      }
    });
  }

  /* -------------------------------
   * Module 1: Sub-Department Handler (index.html)
   * Show or hide sub-department fields based on the chosen department.
   ------------------------------- */
  const departmentSelect = document.getElementById('department');
  if (departmentSelect) {
    departmentSelect.addEventListener('change', function () {
      const selected = this.value; // This gets the chosen department.
      console.log('[INFO] Department selected:', selected);
      // Show the right box or hide it if it's not needed.
      document.getElementById('medical-sub-department').style.display = (selected === 'Medical') ? 'block' : 'none';
      document.getElementById('admin-sub-department').style.display = (selected === 'Administrative') ? 'block' : 'none';
      document.getElementById('support-sub-department').style.display = (selected === 'Support') ? 'block' : 'none';
    });
  }

  /* -------------------------------
   * Module 2: Ticket Form Submission (index.html)
   * Check if the form is filled correctly, read the file if provided,
   * save the ticket, and then reset the form.
   ------------------------------- */
  const ticketForm = document.getElementById('ticketForm');
  if (ticketForm) {
    ticketForm.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (!this.checkValidity()) {
        this.classList.add('was-validated');
        console.log('[WARN] Ticket form validation failed.');
        return;
      }

      console.log('[INFO] Ticket form submitted successfully.');
      // Build a ticket object with all the form information.
      const ticket = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        department: document.getElementById('department').value,
        // Immediately Invoked Function Expression (IIFE) to get sub-department.
        subDepartment: (function () {
          const dept = document.getElementById('department').value;
          if (dept === 'Medical') return document.getElementById('medical-department').value;
          if (dept === 'Administrative') return document.getElementById('admin-department').value;
          if (dept === 'Support') return document.getElementById('support-department').value;
          return '';
        })(),
        issue: document.getElementById('issue').value.trim(),
        screenshot: null, // This will hold our file data if uploaded.
        timestamp: new Date().toISOString(),
        signatures: {
          sig1: true,   // This one is automatically approved.
          sig2: false,  // This one waits for escalation.
          sig3: false   // This one waits for final approval.
        }
      };

      // Check if a screenshot file is provided.
      const fileInput = document.getElementById('screenshot');
      if (fileInput && fileInput.files[0]) {
        const reader = new FileReader(); // FileReader helps us read the file.
        reader.onload = function (e) {
          ticket.screenshot = e.target.result; // Save the file content in our ticket.
          saveTicket(ticket);
          finalizeSubmission();
        };
        reader.readAsDataURL(fileInput.files[0]); // Read file as a base64 encoded string.
      } else {
        saveTicket(ticket);
        finalizeSubmission();
      }

      // This function saves our ticket into local storage (like a digital filing cabinet).
      function saveTicket(ticket) {
        try {
          const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
          tickets.push(ticket);
          localStorage.setItem('tickets', JSON.stringify(tickets));
          console.log('[INFO] Ticket saved:', ticket);
        } catch (error) {
          console.error('[ERROR] Failed to save ticket:', error);
        }
      }

      // This function resets the form and shows a confirmation modal.
      function finalizeSubmission() {
        ticketForm.reset();
        ticketForm.classList.remove('was-validated');
        // Hide sub-department fields after submission.
        ['medical-sub-department', 'admin-sub-department', 'support-sub-department'].forEach(id => {
          const elem = document.getElementById(id);
          if (elem) elem.style.display = 'none';
        });
        const ticketModal = new bootstrap.Modal(document.getElementById('ticketModal'));
        ticketModal.show();
        console.log('[INFO] Ticket submission finalized. Modal displayed.');
      }
    });
  }

  /* -------------------------------
   * Module 3: View Tickets (index.html)
   * When a user clicks "View Saved Tickets", load tickets from local storage
   * and show them in a modal so you can pick one to view.
   ------------------------------- */
  const viewTicketsLink = document.getElementById('viewTicketsLink');
  if (viewTicketsLink) {
    viewTicketsLink.addEventListener('click', function (event) {
      event.preventDefault();
      console.log('[INFO] Loading saved tickets.');
      const ticketList = document.getElementById('ticketList');
      ticketList.innerHTML = '';

      let tickets = [];
      try {
        tickets = JSON.parse(localStorage.getItem('tickets')) || [];
      } catch (error) {
        console.error('[ERROR] Failed to retrieve tickets:', error);
      }

      if (tickets.length === 0) {
        ticketList.innerHTML = '<p class="text-center">No tickets found.</p>';
      } else {
        tickets.forEach((ticket, index) => {
          // Create a button for each saved ticket.
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'list-group-item list-group-item-action';
          btn.innerHTML = `<strong>${ticket.name}</strong> - ${new Date(ticket.timestamp).toLocaleString()}`;
          // When the button is clicked, go to the ticket detail page.
          btn.addEventListener('click', function () {
            window.location.href = `ticket_detail.html?ticketIndex=${index}`;
          });
          ticketList.appendChild(btn);
        });
      }
      const ticketListModal = new bootstrap.Modal(document.getElementById('ticketListModal'));
      ticketListModal.show();
      console.log('[INFO] Saved tickets modal displayed.');
    });
  }

  /* -------------------------------
   * Utility: getParameterByName
   * This function finds a value in the URL query string by its name.
   * Example: ?ticketIndex=2 will return "2" when you ask for "ticketIndex".
   ------------------------------- */
  function getParameterByName(name, url = window.location.href) {
    // Replace special characters in the name for regex.
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
          results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  /* -------------------------------
   * Utility: updateTicket
   * This function updates an existing ticket in local storage.
   * It finds the ticket by its index and saves the new version.
   ------------------------------- */
  function updateTicket(index, updatedTicket) {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets[index] = updatedTicket;
    localStorage.setItem('tickets', JSON.stringify(tickets));
    console.log('[INFO] Ticket updated at index', index, updatedTicket);
  }

  /* -------------------------------
   * Module 4: Ticket Detail & Escalation (ticket_detail.html)
   * This code displays the detailed information of a ticket on its page.
   * It also handles escalation by showing a math problem for approval.
   * Additionally, it allows the admin to verify the ticket by answering a question.
   ------------------------------- */
  const ticketDetailElem = document.getElementById('ticketDetail');
  if (ticketDetailElem) {
    let currentIndex = parseInt(getParameterByName('ticketIndex'), 10);
    if (isNaN(currentIndex)) { currentIndex = 0; }
    renderTicketDetail(currentIndex);

    // Pagination: Previous and Next buttons change the ticket index.
    document.getElementById('prevTicket').addEventListener('click', function () {
      if (currentIndex > 0) {
        currentIndex--;
        window.location.href = `ticket_detail.html?ticketIndex=${currentIndex}`;
      }
    });
    document.getElementById('nextTicket').addEventListener('click', function () {
      let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
      if (currentIndex < tickets.length - 1) {
        currentIndex++;
        window.location.href = `ticket_detail.html?ticketIndex=${currentIndex}`;
      }
    });
  }

  // This function renders the ticket details based on the given index.
  // It shows all the ticket information and then calls renderSignatures() later.
  function renderTicketDetail(index) {
    let tickets = [];
    try {
      tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    } catch (error) {
      console.error('[ERROR] Retrieving tickets failed:', error);
    }
    if (index < 0 || index >= tickets.length) {
      document.getElementById('ticketData').innerHTML = '<li class="list-group-item">Ticket not found.</li>';
      return;
    }
    let ticket = tickets[index];

    // Initialize signatures if they are not present.
    if (!ticket.signatures) {
      const submissionTime = new Date(ticket.timestamp);
      const dueTime = new Date(submissionTime.getTime() + 12 * 60 * 60 * 1000); // 12 hours later
      ticket.signatures = {
        sig1: true,
        sig2: false,
        sig3: false,
        dueTime: dueTime.toISOString()
      };
      updateTicket(index, ticket);
    }

    // Build HTML to display ticket details.
    const ticketData = document.getElementById('ticketData');
    let detailsHTML = `
      <li class="list-group-item"><strong>Name:</strong> ${ticket.name}</li>
      <li class="list-group-item"><strong>Email:</strong> ${ticket.email}</li>
      <li class="list-group-item"><strong>Phone:</strong> ${ticket.phone}</li>
      <li class="list-group-item"><strong>Department:</strong> ${ticket.department}</li>
      ${ticket.subDepartment ? `<li class="list-group-item"><strong>Sub-Department:</strong> ${ticket.subDepartment}</li>` : ''}
      <li class="list-group-item"><strong>Issue:</strong> ${ticket.issue}</li>
    `;
    if (ticket.screenshot) {
      detailsHTML += `
        <li class="list-group-item">
          <strong>Screenshot:</strong><br>
          <img src="${ticket.screenshot}" alt="Ticket Screenshot" class="img-fluid rounded mt-2" style="max-height:200px;">
        </li>
      `;
    }
    detailsHTML += `<li class="list-group-item"><strong>Submitted On:</strong> ${new Date(ticket.timestamp).toLocaleString()}</li>`;
    if (ticket.signatures.dueTime) {
      detailsHTML += `<li class="list-group-item"><strong>Fix Due By:</strong> ${new Date(ticket.signatures.dueTime).toLocaleString()}</li>`;
    }
    ticketData.innerHTML = detailsHTML;

    // Update pagination info.
    document.getElementById('paginationInfo').textContent = `Ticket ${index + 1} of ${tickets.length}`;
    document.getElementById('prevTicket').disabled = (index === 0);
    document.getElementById('nextTicket').disabled = (index === tickets.length - 1);

    // Call function to render signature statuses and escalation options.
    renderSignatures(ticket, index);
  }

  /* -------------------------------
   * Global Variable: correctAnswer
   * This holds the correct answer for our math problem.
   ------------------------------- */
  let correctAnswer = null;

  /* -------------------------------
   * Function: generateMathProblem
   * This function creates a simple addition problem.
   * It picks two random numbers between 1 and 10, sums them, and returns the problem as a string.
   * The correct answer is stored in 'correctAnswer'.
   ------------------------------- */
  function generateMathProblem() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    correctAnswer = a + b;
    return `What is ${a} + ${b}?`;
  }

  /* -------------------------------
   * Function: renderSignatures
   * This function displays the approval status of each signature and handles
   * escalation and final approval steps.
   * We now allow the admin to verify the ticket by answering a question.
   ------------------------------- */
  function renderSignatures(ticket, index) {
    const sigStatusDiv = document.getElementById('signatureStatus');
    const escalationDiv = document.getElementById('escalationProcess');
    sigStatusDiv.innerHTML = '';
    escalationDiv.innerHTML = '';

    // Display Signature 1 (auto-approved).
    sigStatusDiv.innerHTML += `<p><strong>Signature 1:</strong> Approved (Auto-assigned)</p>`;

    // Handle Signature 2: Escalation step.
    if (!ticket.signatures.sig2) {
      sigStatusDiv.innerHTML += `<p><strong>Signature 2:</strong> Pending</p>`;
      escalationDiv.innerHTML = `<button id="escalateBtn" class="btn btn-info">Escalate Ticket (Solve Math Problem)</button>`;
      document.getElementById('escalateBtn').addEventListener('click', function () {
        const mathProblem = generateMathProblem();
        escalationDiv.innerHTML = `
          <p>${mathProblem}</p>
          <div class="input-group mb-3">
            <input type="number" id="mathAnswer" class="form-control" placeholder="Your answer">
            <button id="submitMath" class="btn btn-success">Submit Answer</button>
          </div>
          <div id="mathFeedback"></div>
        `;
        document.getElementById('submitMath').addEventListener('click', function () {
          const userAnswer = parseInt(document.getElementById('mathAnswer').value, 10);
          if (userAnswer === correctAnswer) {
            ticket.signatures.sig2 = true;
            ticket.escalatedBy = currentUser;
            updateTicket(index, ticket);
            let escalatedTickets = JSON.parse(localStorage.getItem('escalatedTickets')) || [];
            escalatedTickets.push(ticket);
            localStorage.setItem('escalatedTickets', JSON.stringify(escalatedTickets));
            escalationDiv.innerHTML = `<p class="text-success">Signature 2 approved! Ticket escalated.</p>`;
            console.log('[INFO] Ticket escalated:', ticket);
            renderSignatures(ticket, index);
          } else {
            document.getElementById('mathFeedback').innerHTML = `<p class="text-danger">Incorrect answer. Please try again.</p>`;
            console.log('[WARN] Incorrect answer provided for escalation.');
          }
        });
      });
    } else {
      sigStatusDiv.innerHTML += `<p><strong>Signature 2:</strong> Approved</p>`;
    }

    // Handle Signature 3: Final Approval step.
    if (ticket.signatures.sig2) {
      if (!ticket.signatures.sig3) {
        // When the ticket is pending admin verification...
        if (ticket.verificationPending) {
          if (currentUser === "AdminUser") {
            // Instead of a secret, ask the admin to verify by answering a question.
            escalationDiv.innerHTML += `
              <div class="admin-verification-container">
                <p>Please answer the verification question to approve the ticket: What is 5 + 3?</p>
                <input type="number" id="adminAnswer" class="form-control" placeholder="Your answer">
                <button id="verifyTicketBtn" class="btn btn-warning mt-2">Verify Ticket</button>
                <div id="adminFeedback"></div>
              </div>
            `;
            document.getElementById('verifyTicketBtn').addEventListener('click', function () {
              const adminAnswer = parseInt(document.getElementById('adminAnswer').value, 10);
              if (adminAnswer === 8) {
                ticket.signatures.sig3 = true;
                updateTicket(index, ticket);
                let solvedTickets = JSON.parse(localStorage.getItem('solvedTickets')) || [];
                solvedTickets.push(ticket);
                localStorage.setItem('solvedTickets', JSON.stringify(solvedTickets));
                document.getElementById('adminFeedback').innerHTML = `<p class="text-success">Ticket verified and resolved!</p>`;
                console.log('[INFO] Ticket verified by admin:', ticket);
                renderSignatures(ticket, index);
              } else {
                document.getElementById('adminFeedback').innerHTML = `<p class="text-danger">Incorrect answer. Please try again.</p>`;
              }
            });
          } else {
            escalationDiv.innerHTML += `<p class="text-info">Ticket is pending admin verification.</p>`;
          }
        } else if (ticket.escalatedBy === currentUser && currentUser !== "AdminUser") {
          // Allow non-admin users to send the ticket back for admin verification.
          escalationDiv.innerHTML += `<button id="sendBackBtn" class="btn btn-secondary mt-2">Send Ticket Back for Verification</button>`;
          document.getElementById('sendBackBtn').addEventListener('click', function () {
            ticket.verificationPending = true;
            updateTicket(index, ticket);
            escalationDiv.innerHTML = `<p class="text-info">Ticket sent back for verification. Awaiting admin approval.</p>`;
            console.log('[INFO] Ticket sent back for verification:', ticket);
            renderSignatures(ticket, index);
          });
        } else {
          // For all others, allow final approval without the verification question.
          escalationDiv.innerHTML += `<button id="finalApprovalBtn" class="btn btn-warning mt-2">Final Approval</button>`;
          document.getElementById('finalApprovalBtn').addEventListener('click', function () {
            ticket.signatures.sig3 = true;
            updateTicket(index, ticket);
            let solvedTickets = JSON.parse(localStorage.getItem('solvedTickets')) || [];
            solvedTickets.push(ticket);
            localStorage.setItem('solvedTickets', JSON.stringify(solvedTickets));
            escalationDiv.innerHTML = `<p class="text-success">Ticket fully approved and resolved!</p>`;
            console.log('[INFO] Ticket resolved by final approval:', ticket);
            renderSignatures(ticket, index);
          });
        }
      } else {
        sigStatusDiv.innerHTML += `<p><strong>Signature 3:</strong> Approved (Ticket Resolved)</p>`;
      }
    }
  }

  /* -------------------------------
   * Module 5: Display Solved Tickets (solved_tickets.html)
   * This function shows a list of tickets that are fully resolved.
   ------------------------------- */
  const solvedListElem = document.getElementById('solvedList');
  if (solvedListElem) {
    displaySolvedTickets();
  }
  function displaySolvedTickets() {
    let solvedTickets = [];
    try {
      solvedTickets = JSON.parse(localStorage.getItem('solvedTickets')) || [];
    } catch (error) {
      console.error('[ERROR] Retrieving solved tickets failed:', error);
    }
    let itemsHTML = '';
    if (solvedTickets.length === 0) {
      itemsHTML = '<p>No solved tickets found.</p>';
    } else {
      solvedTickets.forEach((ticket) => {
        itemsHTML += `
          <div class="solved-item">
            <p><strong>${ticket.name}</strong></p>
            <p>Submitted: ${new Date(ticket.timestamp).toLocaleString()}</p>
            <p>Fix Due By: ${ticket.signatures.dueTime ? new Date(ticket.signatures.dueTime).toLocaleString() : 'N/A'}</p>
            <p>Resolved: ${ticket.signatures.sig3 ? 'Yes' : 'No'}</p>
          </div>
        `;
      });
    }
    solvedListElem.innerHTML = `<h2>Solved Tickets</h2>` + itemsHTML;
    console.log('[INFO] Solved tickets displayed.');
  }

  /* -------------------------------
   * Module 6: Display Escalated Tickets Timeline (ticket_escalated.html)
   * This function shows a timeline of tickets that have been escalated.
   ------------------------------- */
  const escalatedTimelineElem = document.getElementById('escalatedTimeline');
  if (escalatedTimelineElem) {
    displayEscalatedTimeline();
  }
  function displayEscalatedTimeline() {
    let escalatedTickets = [];
    try {
      escalatedTickets = JSON.parse(localStorage.getItem('escalatedTickets')) || [];
    } catch (error) {
      console.error('[ERROR] Retrieving escalated tickets failed:', error);
    }
    let timelineHTML = '';
    if (escalatedTickets.length === 0) {
      timelineHTML = '<p>No escalated tickets found.</p>';
    } else {
      escalatedTickets.forEach((ticket) => {
        // Choose arrow color based on verification status.
        let arrowClass = ticket.verificationPending ? "arrow-yellow" : "arrow-green";
        timelineHTML += `
          <div class="timeline-item">
            <i class="fas fa-arrow-up ${arrowClass}" aria-hidden="true"></i>
            <p><strong>${ticket.name}</strong> - Escalated on: ${new Date(ticket.escalationTime).toLocaleString()}</p>
            <p>Issue: ${ticket.issue}</p>
          </div>
        `;
      });
    }
    escalatedTimelineElem.innerHTML = timelineHTML;
    console.log('[INFO] Escalated timeline displayed.');
  }

  /* -------------------------------
   * Module 7: Display Tracking Tickets (ticket_tracking.html)
   * This function shows tickets that are still open (not fully resolved).
   ------------------------------- */
  const trackingTicketsElem = document.getElementById('trackingTickets');
  if (trackingTicketsElem) {
    displayTrackingTickets();
  }
  function displayTrackingTickets() {
    let tickets = [];
    try {
      tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    } catch (error) {
      console.error('[ERROR] Retrieving tickets for tracking failed:', error);
    }
    let trackingHTML = '';
    // Filter for tickets that are not resolved (Signature 3 is false).
    const inProgressTickets = tickets.filter(ticket => !ticket.signatures || !ticket.signatures.sig3);
    if (inProgressTickets.length === 0) {
      trackingHTML = '<p>All tickets have been resolved.</p>';
    } else {
      inProgressTickets.forEach((ticket) => {
        trackingHTML += `
          <div class="tracking-item">
            <p><strong>${ticket.name}</strong></p>
            <p>Status: ${ticket.signatures && ticket.signatures.sig2 ? 'Escalated' : 'Open'}</p>
            <p>Submitted: ${new Date(ticket.timestamp).toLocaleString()}</p>
            ${ticket.signatures && ticket.signatures.dueTime ? `<p>Fix Due By: ${new Date(ticket.signatures.dueTime).toLocaleString()}</p>` : ''}
          </div>
        `;
      });
    }
    trackingTicketsElem.innerHTML = trackingHTML;
    console.log('[INFO] Tracking tickets displayed.');
  }
});
