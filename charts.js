(function() {
    let ticketChart;
  
    // Define escalation order (assumed global for ticket status)
    const escalationOrder = window.escalationOrder || ["1", "2", "3", "4", "archived"];
  
    // Create the chart container matching the reference file display style.
    function initChart() {
      let chartsSection = document.getElementById('chartsSection');
      if (!chartsSection) {
        chartsSection = document.createElement('section');
        chartsSection.id = 'chartsSection';
        chartsSection.className = 'container';
        chartsSection.style.margin = "20px auto";
        chartsSection.style.padding = "15px";
        chartsSection.style.maxWidth = "1200px";
        // Insert before the Kanban board if available
        const kanbanBoard = document.getElementById('kanbanBoard');
        if (kanbanBoard) {
          kanbanBoard.parentNode.insertBefore(chartsSection, kanbanBoard);
        } else {
          document.body.insertBefore(chartsSection, document.body.firstChild);
        }
      }
  
      // Create a chart container div styled like the reference file.
      let chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      // Optionally add a header for the chart.
      let header = document.createElement('h3');
      header.className = 'text-center';
      header.innerText = 'Ticket Distribution by Status';
      chartContainer.appendChild(header);
  
      // Create the canvas for Chart.js.
      let canvas = document.createElement('canvas');
      canvas.id = 'ticketChart';
      chartContainer.appendChild(canvas);
  
      chartsSection.appendChild(chartContainer);
  
      // Initialize the chart.
      ticketChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: escalationOrder,
          datasets: [{
            label: 'Tickets per Status',
            data: new Array(escalationOrder.length).fill(0),
            backgroundColor: [
              "rgba(54, 162, 235, 0.5)",  // Step 1
              "rgba(255, 206, 86, 0.5)",   // Step 2
              "rgba(75, 192, 192, 0.5)",   // Step 3
              "rgba(153, 102, 255, 0.5)",  // Step 4
              "rgba(255, 99, 132, 0.5)"    // Archived
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Ticket Distribution by Status' }
          },
          scales: {
            y: {
              beginAtZero: true,
              precision: 0
            }
          }
        }
      });
    }
  
    // Update chart data based on the global "allTickets" variable.
    function updateChartData() {
      if (!ticketChart) return;
      // Calculate counts for each status from allTickets.
      const counts = escalationOrder.map(status => {
        if (typeof window.allTickets === 'undefined') return 0;
        return window.allTickets.filter(ticket => ticket.status === status).length;
      });
      ticketChart.data.datasets[0].data = counts;
      ticketChart.update();
    }
  
    // Initialize the chart and set up a real-time update interval.
    document.addEventListener('DOMContentLoaded', () => {
      initChart();
      // Update the chart every second.
      setInterval(updateChartData, 1000);
    });
  })();
  