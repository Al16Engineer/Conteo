document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const statusMessage = document.getElementById('statusMessage');
    
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmsaMtvKJYg1U7Sh42p7kw1pvk5Mi7Z4xII4hvpNn7me4C9HzrRWGFVSsAVzhrQT_I/exec';
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = this.querySelector('.btn');
        
        if (!username || !password) {
            showMessage('Por favor, completa todos los campos', 'error');
            return;
        }
        
        submitBtn.classList.add('loading');
        statusMessage.style.display = 'none';
        
        fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(response => {
            if (!response.success || !response.data) {
                throw new Error('Error en la respuesta del servidor');
            }

            const usuarioEncontrado = response.data.find(user => 
                String(user.USUARIO).toLowerCase() === String(username).toLowerCase() && 
                String(user.PASSWORD) === String(password)
            );

            if (usuarioEncontrado) {
                if (usuarioEncontrado.ESTADO !== 'ACTIVO') {
                    showMessage('Usuario Inactivo. Por favor contacte al administrador.', 'error');
                    submitBtn.classList.remove('loading');
                    return;
                }

                let welcomeMessage = 'Inicio de sesión exitoso. Bienvenido, ' + usuarioEncontrado.NOMBRE;
                
                if (usuarioEncontrado.SEDE === 'ALL') {
                    welcomeMessage += '<br>Por favor selecciona una sede';
                } else {
                    welcomeMessage += '<br>Sede: ' + usuarioEncontrado.SEDE;
                }
                
                statusMessage.innerHTML = welcomeMessage;
                statusMessage.className = 'status-message success';
                statusMessage.style.display = 'block';
                
                const userSession = {
                    username: username,
                    nombre: usuarioEncontrado.NOMBRE,
                    cargo: usuarioEncontrado.CARGO || '',
                    sede: usuarioEncontrado.SEDE || '',
                    timestamp: new Date().getTime()
                };
                
                if (usuarioEncontrado.SEDE === 'ALL') {
                    setTimeout(() => {
                        showSedeModal(userSession);
                    }, 3000);
                } else {
                    localStorage.setItem('userSession', JSON.stringify(userSession));
                    setTimeout(() => {
                        window.location.href = 'ingreso.html';
                    }, 3000);
                }
            } else {
                showMessage('Usuario o contraseña incorrectos', 'error');
            }
            submitBtn.classList.remove('loading');
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error de conexión. Por favor intente más tarde.', 'error');
            submitBtn.classList.remove('loading');
        });
    });
    
    function showMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        statusMessage.style.display = 'block';
    }
    
    function showSedeModal(userSession) {
        const modal = document.getElementById('sedeModal');
        const sedeButtons = document.querySelectorAll('.sede-btn');
        
        modal.style.display = 'flex';
        
        sedeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const selectedSede = this.getAttribute('data-sede');
                
                userSession.sede = selectedSede;
                localStorage.setItem('userSession', JSON.stringify(userSession));
                
                modal.style.display = 'none';
                
                showMessage(`Sede ${selectedSede} seleccionada. Redirigiendo...`, 'success');
                
                setTimeout(() => {
                    window.location.href = 'ingreso.html';
                }, 1500);
            });
        });
    }
});