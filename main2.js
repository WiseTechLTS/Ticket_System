document.addEventListener('DOMContentLoaded', function() {
    // Dynamically load Animate.css if not already included
    if (!document.querySelector('link[href*="animate.css"]')) {
      const animateLink = document.createElement('link');
      animateLink.rel = 'stylesheet';
      animateLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';
      document.head.appendChild(animateLink);
    }
  
    console.log('[INFO] IT Ticket System initialized.');
    const currentUser = "UserA"; // Use "AdminUser" to simulate admin privileges
  
    // Section Navigation
    const sections = document.querySelectorAll('main > section');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-target');
        sections.forEach(sec => sec.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      });
    });
  
    // Dark Mode Toggle
    const toggleBtn = document.getElementById('toggleTheme');
    toggleBtn.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
    });
  
    // Department Sub-selection Handling
    const departmentSelect = document.getElementById('department');
    departmentSelect.addEventListener('change', function() {
      const dept = this.value;
      document.getElementById('medicalSub').style.display = (dept === 'Medical') ? 'block' : 'none';
      document.getElementById('adminSub').style.display = (dept === 'Administrative') ? 'block' : 'none';
      document.getElementById('supportSub').style.display = (dept === 'Support') ? 'block' : 'none';
    });
  
    // File Preview: Display preview when a file is chosen
    const screenshotInput = document.getElementById('screenshot');
    screenshotInput.addEventListener('change', function() {
      const file = this.files[0];
      const previewContainer = document.getElementById('filePreviewContainer');
      previewContainer.innerHTML = ''; // Clear previous preview
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = 'Screenshot Preview';
          img.classList.add('visible', 'animate__animated', 'animate__fadeIn');
          previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });
  
    // Utility: Retrieve tickets from localStorage
    function getTickets() {
      return JSON.parse(localStorage.getItem('tickets')) || [];
    }
  
    // Utility: Save tickets to localStorage
    function saveTickets(tickets) {
      localStorage.setItem('tickets', JSON.stringify(tickets));
    }
  
    // Asynchronously post the ticket JSON to the backend API
    async function postTicketToBackend(ticket) {
      try {
        const response = await fetch('http://10.10.10.1:8000/api/tickets/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ticket)
        });
        if (!response.ok) {
          console.error('[ERROR] Backend failed to save ticket:', response.statusText);
        } else {
          console.log('[INFO] Ticket saved to backend successfully.');
        }
      } catch (error) {
        console.error('[ERROR] Network error while saving ticket:', error);
      }
    }
  
    // Updated addTicket function: Save to localStorage and post asynchronously to backend
    async function addTicket(ticket) {
      // Save to localStorage
      const tickets = getTickets();
      tickets.push(ticket);
      saveTickets(tickets);
  
      // Post asynchronously to backend API
      await postTicketToBackend(ticket);
  
      console.log('[INFO] Ticket submitted:', ticket);
  
      // Reset form and UI elements
      ticketForm.reset();
      ticketForm.classList.remove('was-validated');
      ['medicalSub', 'adminSub', 'supportSub'].forEach(id => {
        document.getElementById(id).style.display = 'none';
      });
  
      // Show success modal with animation
      const modalEl = document.getElementById('ticketModal');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
      modalEl.addEventListener('shown.bs.modal', () => {
        modalEl.querySelector('.modal-body').classList.add('animate__animated', 'animate__bounceIn');
      });
  
      // Refresh all sections and animate with fade-in
      refreshAllSections();
      document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('animate__animated', 'animate__fadeIn');
        setTimeout(() => {
          section.classList.remove('animate__animated', 'animate__fadeIn');
        }, 1000);
      });
    }
  
    // Ticket Form Submission Handler
    const ticketForm = document.getElementById('ticketForm');
    ticketForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // If the form is invalid, show the native validation styling and abort
      if (!ticketForm.checkValidity()) {
        ticketForm.classList.add('was-validated');
        return;
      }
  
      const formData = new FormData(ticketForm);
      const ticket = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        subDepartment: (function() {
          if (formData.get('department') === 'Medical') return formData.get('medicalDept');
          if (formData.get('department') === 'Administrative') return formData.get('adminDept');
          if (formData.get('department') === 'Support') return formData.get('supportDept');
          return '';
        })(),
        issue: formData.get('issue').trim(),
        screenshot: null,
        timestamp: new Date().toISOString(),
        signatures: { sig1: true, sig2: false, sig3: false }
      };
  
      // Handle screenshot upload if provided
      const fileInput = document.getElementById('screenshot');
      if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          ticket.screenshot = e.target.result;
          addTicket(ticket);
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        addTicket(ticket);
      }
    });
  
    // Render Ticket Details for a given index
    function renderTicketDetail(index) {
      const tickets = getTickets();
      if (index < 0 || index >= tickets.length) {
        document.getElementById('ticketData').innerHTML = '<li class="list-group-item">Ticket not found.</li>';
        return;
      }
      const ticket = tickets[index];
      // Set due time if not already set
      if (!ticket.signatures.dueTime) {
        const dueTime = new Date(new Date(ticket.timestamp).getTime() + 12 * 60 * 60 * 1000);
        ticket.signatures.dueTime = dueTime.toISOString();
        tickets[index] = ticket;
        saveTickets(tickets);
      }
  
      let detailsHTML = `
        <li class="list-group-item"><strong>Name:</strong> ${ticket.name}</li>
        <li class="list-group-item"><strong>Email:</strong> ${ticket.email}</li>
        <li class="list-group-item"><strong>Phone:</strong> ${ticket.phone}</li>
        <li class="list-group-item"><strong>Department:</strong> ${ticket.department}</li>
        ${ticket.subDepartment ? `<li class="list-group-item"><strong>Sub-Department:</strong> ${ticket.subDepartment}</li>` : ''}
        <li class="list-group-item"><strong>Issue:</strong> ${ticket.issue}</li>
        ${ticket.screenshot ? `<li class="list-group-item"><img src="${ticket.screenshot}" alt="Screenshot" class="img-fluid" style="max-height:200px;"></li>` : ''}
        <li class="list-group-item"><strong>Submitted:</strong> ${new Date(ticket.timestamp).toLocaleString()}</li>
        <li class="list-group-item"><strong>Fix Due By:</strong> ${new Date(ticket.signatures.dueTime).toLocaleString()}</li>
      `;
  
      document.getElementById('ticketData').innerHTML = detailsHTML;
      document.getElementById('paginationInfo').textContent = `Ticket ${index + 1} of ${tickets.length}`;
      document.getElementById('prevTicket').disabled = (index === 0);
      document.getElementById('nextTicket').disabled = (index === tickets.length - 1);
      renderSignatures(ticket, index);
    }
  
    // Render Signatures and Escalation Process
    function renderSignatures(ticket, index) {
      const sigStatus = document.getElementById('signatureStatus');
      const escalationDiv = document.getElementById('escalationProcess');
      sigStatus.innerHTML = '';
      escalationDiv.innerHTML = '';
  
      // Signature 1 is auto-approved
      sigStatus.innerHTML += `<p><strong>Signature 1:</strong> Approved</p>`;
  
      // Signature 2 pending escalation
      if (!ticket.signatures.sig2) {
        sigStatus.innerHTML += `<p><strong>Signature 2:</strong> Pending</p>`;
        escalationDiv.innerHTML = `<button id="escalateBtn" class="btn btn-info">Escalate Ticket</button>`;
        document.getElementById('escalateBtn').addEventListener('click', function() {
          // Generate a simple math problem
          const a = Math.floor(Math.random() * 10) + 1;
          const b = Math.floor(Math.random() * 10) + 1;
          const correct = a + b;
          escalationDiv.innerHTML = `
            <p>Solve: ${a} + ${b} = ?</p>
            <div class="input-group mb-3">
              <input type="number" id="mathAnswer" class="form-control" placeholder="Your answer">
              <button id="submitMath" class="btn btn-success">Submit</button>
            </div>
            <div id="mathFeedback"></div>
          `;
          document.getElementById('submitMath').addEventListener('click', function() {
            const answer = parseInt(document.getElementById('mathAnswer').value, 10);
            if (answer === correct) {
              ticket.signatures.sig2 = true;
              ticket.escalatedBy = currentUser;
  
              let tickets = getTickets();
              tickets[index] = ticket;
              saveTickets(tickets);
  
              let escalated = JSON.parse(localStorage.getItem('escalatedTickets')) || [];
              ticket.escalationTime = new Date().toISOString();
              escalated.push(ticket);
              localStorage.setItem('escalatedTickets', JSON.stringify(escalated));
  
              escalationDiv.innerHTML = `<p class="text-success">Ticket escalated successfully.</p>`;
              renderSignatures(ticket, index);
              refreshAllSections();
            } else {
              document.getElementById('mathFeedback').innerHTML = `<p class="text-danger">Incorrect answer. Try again.</p>`;
            }
          });
        });
      } else {
        sigStatus.innerHTML += `<p><strong>Signature 2:</strong> Approved</p>`;
      }
  
      // Signature 3 final approval
      if (ticket.signatures.sig2 && !ticket.signatures.sig3) {
        escalationDiv.innerHTML += `<button id="finalApproveBtn" class="btn btn-warning mt-2">Final Approval</button>`;
        document.getElementById('finalApproveBtn').addEventListener('click', function() {
          ticket.signatures.sig3 = true;
  
          let tickets = getTickets();
          tickets[index] = ticket;
          saveTickets(tickets);
  
          let solved = JSON.parse(localStorage.getItem('solvedTickets')) || [];
          solved.push(ticket);
          localStorage.setItem('solvedTickets', JSON.stringify(solved));
  
          escalationDiv.innerHTML = `<p class="text-success">Ticket fully approved.</p>`;
          renderSignatures(ticket, index);
          refreshAllSections();
        });
      } else if (ticket.signatures.sig3) {
        sigStatus.innerHTML += `<p><strong>Signature 3:</strong> Approved</p>`;
      }
    }
  
    // Ticket Details Pagination Navigation
    const prevBtn = document.getElementById('prevTicket');
    const nextBtn = document.getElementById('nextTicket');
    prevBtn.addEventListener('click', function() {
      const tickets = getTickets();
      const current = parseInt(document.getElementById('paginationInfo').textContent.split(' ')[1]) - 1;
      if (current > 0) renderTicketDetail(current - 1);
    });
    nextBtn.addEventListener('click', function() {
      const tickets = getTickets();
      const current = parseInt(document.getElementById('paginationInfo').textContent.split(' ')[1]) - 1;
      if (current < tickets.length - 1) renderTicketDetail(current + 1);
    });
  
    // Refresh all sections: Details, Timeline, Tracking, Solved
    function refreshAllSections() {
      const tickets = getTickets();
      // Render first ticket if any
      if (tickets.length > 0) {
        renderTicketDetail(0);
      } else {
        document.getElementById('ticketData').innerHTML = '<li class="list-group-item">No tickets available.</li>';
        document.getElementById('paginationInfo').textContent = '';
      }
  
      // Refresh Timeline
      let escalated = JSON.parse(localStorage.getItem('escalatedTickets')) || [];
      let timelineHTML =
        escalated.length === 0
          ? '<p>No escalated tickets.</p>'
          : escalated
              .map(
                ticket => `
              <div class="timeline-item">
                <i class="fas fa-arrow-up"></i>
                <span><strong>${ticket.name}</strong> escalated on ${new Date(ticket.escalationTime).toLocaleString()}</span>
              </div>
            `
              )
              .join('');
      document.getElementById('timelineContent').innerHTML = timelineHTML;
  
      // Refresh Tracking
      let trackingHTML = '';
      if (tickets.length === 0) {
        trackingHTML = '<p>No tickets to track.</p>';
      } else {
        tickets.forEach(ticket => {
          if (!ticket.signatures.sig3) {
            trackingHTML += `
              <div class="tracking-item">
                <p><strong>${ticket.name}</strong></p>
                <p>Status: ${ticket.signatures.sig2 ? 'Escalated' : 'Open'}</p>
                <p>Submitted: ${new Date(ticket.timestamp).toLocaleString()}</p>
                <button class="btn btn-sm btn-primary viewDetail" data-timestamp="${ticket.timestamp}">View Details</button>
              </div>
            `;
          }
        });
      }
      document.getElementById('trackingList').innerHTML = trackingHTML;
  
      // Refresh Solved Tickets
      let solved = JSON.parse(localStorage.getItem('solvedTickets')) || [];
      let solvedHTML =
        solved.length === 0
          ? '<p>No solved tickets.</p>'
          : solved
              .map(
                ticket => `
              <div class="solved-item">
                <p><strong>${ticket.name}</strong></p>
                <p>Submitted: ${new Date(ticket.timestamp).toLocaleString()}</p>
                <p>Resolved: ${new Date(ticket.signatures.dueTime).toLocaleString()}</p>
              </div>
            `
              )
              .join('');
      document.getElementById('solvedList').innerHTML = solvedHTML;
    }
  
    refreshAllSections();
  
    // Tracking: View Detail from Tracking List (Event Delegation)
    const trackingList = document.getElementById('trackingList');
    trackingList.addEventListener('click', function(e) {
      if (e.target.classList.contains('viewDetail')) {
        const ts = e.target.getAttribute('data-timestamp');
        const tickets = getTickets();
        const index = tickets.findIndex(t => t.timestamp === ts);
        if (index !== -1) {
          sections.forEach(sec => sec.classList.remove('active'));
          document.getElementById('detailsSection').classList.add('active');
          navLinks.forEach(link => link.classList.remove('active'));
          document.querySelector('.nav-link[data-target="detailsSection"]').classList.add('active');
          renderTicketDetail(index);
        }
      }
    });
  
    // Tracking: Search Functionality
    const ticketSearch = document.getElementById('ticketSearch');
    ticketSearch.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      const tickets = getTickets();
      let filtered = tickets.filter(
        ticket =>
          ticket.name.toLowerCase().includes(query) ||
          ticket.issue.toLowerCase().includes(query)
      );
      let trackingHTML = '';
      if (filtered.length === 0) {
        trackingHTML = '<p>No tickets match your search.</p>';
      } else {
        filtered.forEach(ticket => {
          if (!ticket.signatures.sig3) {
            trackingHTML += `
              <div class="tracking-item">
                <p><strong>${ticket.name}</strong></p>
                <p>Status: ${ticket.signatures.sig2 ? 'Escalated' : 'Open'}</p>
                <p>Submitted: ${new Date(ticket.timestamp).toLocaleString()}</p>
                <button class="btn btn-sm btn-primary viewDetail" data-timestamp="${ticket.timestamp}">View Details</button>
              </div>
            `;
          }
        });
      }
      document.getElementById('trackingList').innerHTML = trackingHTML;
    });
  });
  