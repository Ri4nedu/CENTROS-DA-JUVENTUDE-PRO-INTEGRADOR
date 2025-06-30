
        // Navegação entre páginas
        function showPage(pageId) {
            // Remove active class from all menu items and pages
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Add active class to clicked menu item and corresponding page
            event.target.classList.add('active');
            document.getElementById(pageId).classList.add('active');
        }

        // Função para carregar notas
        function loadGrades() {
            // Simulação de carregamento de notas
            console.log('Carregando notas...');
        }

        // Função para salvar notas
        function saveGrades() {
            alert('Notas salvas com sucesso!');
        }

        // Função para salvar frequência
        function saveAttendance() {
            alert('Frequência salva com sucesso!');
        }

        // Modal functions
        function openUploadModal() {
            document.getElementById('uploadModal').style.display = 'block';
        }

        function closeUploadModal() {
            document.getElementById('uploadModal').style.display = 'none';
        }

        function uploadMaterial() {
            alert('Material enviado com sucesso!');
            closeUploadModal();
        }

        // Fechar modal clicando fora dele
        window.onclick = function(event) {
            const modal = document.getElementById('uploadModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }

        // Simulação de dados dinâmicos
        function updateStats() {
            // Aqui você conectaria com uma API real
            console.log('Atualizando estatísticas...');
        }

        // Atualizar stats a cada 5 minutos
        setInterval(updateStats, 300000);

        // Efeitos visuais para inputs de nota
        document.addEventListener('DOMContentLoaded', function() {
            const gradeInputs = document.querySelectorAll('.grade-input');
            gradeInputs.forEach(input => {
                input.addEventListener('change', function() {
                    const grade = parseFloat(this.value);
                    const statusCell = this.closest('tr').querySelector('td:last-child span');
                    
                    if (grade >= 7) {
                        statusCell.className = 'btn btn-success';
                        statusCell.textContent = 'Aprovado';
                    } else if (grade >= 5) {
                        statusCell.className = 'btn btn-warning';
                        statusCell.textContent = 'Recuperação';
                    } else {
                        statusCell.className = 'btn btn-danger';
                        statusCell.textContent = 'Reprovado';
                    }
                });
            });
        });
