document.addEventListener('DOMContentLoaded', function () {
  
    const ctx = document.getElementById("frequenciaChart");
    if (ctx) {
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Presenças", "Faltas"],
          datasets: [{
            data: [85, 15],
            backgroundColor: ["#2196f3", "#f44336"]
          }]
        },
        options: {
          responsive: false,
          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
    }
  });
  