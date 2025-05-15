// URL del script de Google Apps Script
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzkvqnflAjsYuXlmB4N7SRQjUQruEFmjtY57L-VC-bVTFKrek9B-Jrp-JdCp-M_FZcR/exec';

// Cache for inventory data
let inventoryDataCache = null;
let registrosDataCache = null;

// Prevención de navegación hacia atrás
window.addEventListener('load', function() {
    window.history.pushState({ page: 1 }, "", "");
});

// Manejador para el evento popstate (botón atrás)
window.addEventListener('popstate', function(event) {
    event.preventDefault();
    document.getElementById("modalSalir").style.display = "flex";
    window.history.pushState({ page: 1 }, "", "");
});

// Configurar botón de cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', function() {
    document.getElementById("modalSalir").style.display = "flex";
});

// Verificar si hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que los modales estén ocultos al cargar
    document.getElementById("modalSalir").style.display = "none";
    document.getElementById("modalConfirmacion").style.display = "none";
    
    // Verificar sesión de usuario
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    console.log('User session:', userSession); // Debug log

    if (!userSession || !userSession.username) {
        localStorage.removeItem('userSession');
        window.location.replace('index.html');
        return;
    }
    
    // Mostrar información del usuario
    document.getElementById('userName').textContent = userSession.nombre || userSession.username;
    document.getElementById('userRole').textContent = userSession.cargo || 'Usuario';
    
    // Asegurarse de que el valor de sede se muestre correctamente
    const sedeElement = document.getElementById('userSede');
    if (sedeElement) {
        sedeElement.textContent = userSession.sede || 'Sede no especificada';
    }
    
    // New code for logo and name changes
    const currentSede = (userSession.sede || '').toUpperCase();
    if (currentSede === 'FILANDIA') {
        document.getElementById('restaurantLogo').src = 'img/logoMP.png';
        document.querySelector('#restaurantName .restaurant-name').textContent = 'Mesón de Piedra Campestre';
    } else {
        document.getElementById('restaurantLogo').src = 'img/logoSR.png';
        document.querySelector('#restaurantName .restaurant-name').textContent = 'La Portada Campestre';
    }
    
    document.getElementById('responsable').value = userSession.nombre || userSession.username;
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos iniciales
    loadInventoryData();
});

// Function to load inventory data
async function loadInventoryData() {
    try {
        console.log('Fetching articles data...');
        const response = await fetch(`${SHEETS_API_URL}?api=articulos`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Articles data received:', data);
        
        if (data.success) {
            inventoryDataCache = data.data;
            // Log the first few items to see their structure
            console.log('Sample inventory items:', inventoryDataCache.slice(0, 5));
            cargarTiposInventario();
        } else {
            throw new Error(data.message || 'Error al cargar artículos');
        }
        
    } catch (error) {
        console.error('Error loading articles:', error);
        alert('Error al cargar los datos. Por favor recarga la página.');
    }
}

// Cargar tipos de inventario desde cache
function cargarTiposInventario() {
    try {
        if (!inventoryDataCache) {
            throw new Error('No hay datos en caché');
        }
        
        const tipoSelect = document.getElementById("tipoInventario");
        tipoSelect.innerHTML = '<option value="" disabled selected>Selecciona el tipo de inventario</option>';
        
        // Get unique types
        const tipos = [...new Set(inventoryDataCache.map(item => item.TIPO))].filter(Boolean);
        console.log('Types found:', tipos);
        
        // Add options
        tipos.sort().forEach(tipo => {
            const option = document.createElement("option");
            option.value = tipo;
            option.textContent = tipo;
            tipoSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading types:', error);
    }
}

// Cargar categorías desde cache
function cargarCategorias() {
    if (!inventoryDataCache) {
        console.error('No inventory data in cache when loading categories');
        return;
    }
    
    const tipo = document.getElementById("tipoInventario").value;
    console.log(`Loading categories for tipo: "${tipo}"`);
    
    if (!tipo) {
        console.warn('No tipo selected, cannot load categories');
        return;
    }
    
    const categoriaSelect = document.getElementById("categoria");
    categoriaSelect.innerHTML = '<option value="" disabled selected>Selecciona una categoría</option>';
    
    // Filter categories from cached data
    const categorias = inventoryDataCache
        .filter(item => item.TIPO === tipo)
        .map(item => item.CATEGORIA)
        .filter((cat, index, self) => cat && self.indexOf(cat) === index);
    
    console.log(`Found ${categorias.length} categories for tipo "${tipo}":`, categorias);
    
    categorias.sort().forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoriaSelect.appendChild(option);
    });
    
    document.getElementById("errorTipo").style.display = "none";
    
    // Reset mode and date when tipo changes
    document.getElementById('modo').value = '';
    document.getElementById('fecha').value = '';
}

// Fix the event listener for tipo changes
function setupEventListeners() {
    // Evento para el select de tipo de inventario
    document.getElementById('tipoInventario').addEventListener('change', function() {
        console.log('Tipo changed, loading categories...');
        cargarCategorias();
    });
    
    // Evento para el select de categoría
    document.getElementById('categoria').addEventListener('change', function() {
        console.log('Categoria changed, updating mode and date...');
        updateModeAndDate();
        document.getElementById("errorCategoria").style.display = "none";
    });
    
    // Evento para el botón continuar
    document.getElementById('continuarBtn').addEventListener('click', continuar);
    
    // Eventos para los modales
    document.getElementById('confirmarBtn').addEventListener('click', confirmarContinuar);
    document.getElementById('cancelarConfirmacionBtn').addEventListener('click', () => cerrarModal('modalConfirmacion'));
    document.getElementById('confirmarSalirBtn').addEventListener('click', confirmarSalir);
    document.getElementById('cancelarSalirBtn').addEventListener('click', () => cerrarModal('modalSalir'));
    
    // Prevenir el uso de atajos de teclado para navegación hacia atrás
    document.addEventListener('keydown', function(e) {
        // Prevenir Backspace a menos que estemos en un input o textarea
        if ((e.key === 'Backspace' || e.key === 'Back') && 
            (document.activeElement.tagName !== 'INPUT' && 
             document.activeElement.tagName !== 'TEXTAREA')) {
            e.preventDefault();
        }
        
        // Prevenir Ctrl+Flecha izquierda (navegación hacia atrás en algunos navegadores)
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
            e.preventDefault();
        }
    });
}

// New function to fetch mode directly from API
async function fetchModoFromAPI(tipo, categoria) {
    try {
        console.log(`Fetching mode for tipo: "${tipo}" and categoria: "${categoria}"`);
        const url = `${SHEETS_API_URL}?api=articulos&tipo=${encodeURIComponent(tipo)}&categoria=${encodeURIComponent(categoria)}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Mode data received:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            const modoItem = data.data[0];
            console.log('Mode item:', modoItem);
            
            if (modoItem.MODO) {
                return modoItem.MODO;
            }
        }
        
        // If no mode found in API response, use default logic
        return getDefaultModo(tipo, categoria);
        
    } catch (error) {
        console.error('Error fetching mode:', error);
        // Fallback to default logic if API call fails
        return getDefaultModo(tipo, categoria);
    }
}

// Update the updateModeAndDate function to use the new API call
async function updateModeAndDate() {
    const tipo = document.getElementById('tipoInventario').value;
    const categoria = document.getElementById('categoria').value;
    const modoInput = document.getElementById('modo');
    const fecha = document.getElementById('fecha');
    const fechaLabel = document.querySelector('label[for="fecha"]');
    
    if (!tipo || !categoria) {
        console.log('Tipo or categoria not selected yet');
        return;
    }
    
    console.log(`Updating mode for tipo: "${tipo}", categoria: "${categoria}"`);
    
    // Show loading indicator
    modoInput.value = "Cargando...";
    fecha.value = "";
    
    // Fetch mode from API
    const modoInventario = await fetchModoFromAPI(tipo, categoria);
    console.log(`Found modo: "${modoInventario}"`);
    
    // Set the mode value
    modoInput.value = modoInventario;

    // If no mode was found, exit early
    if (!modoInventario) {
        console.log('No mode found, not updating date');
        return;
    }

    const today = new Date();

    // Update fecha label and value based on modo
    switch(modoInventario.toUpperCase()) {
        case 'DIARIO':
            fechaLabel.textContent = 'Fecha';
            fecha.value = today.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            break;
            
        case 'SEMANAL':
            fechaLabel.textContent = 'Día';
            const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
            fecha.value = days[today.getDay()];
            break;
            
        case 'MENSUAL':
            fechaLabel.textContent = 'Mes';
            fecha.value = today.toLocaleDateString('es-ES', {
                month: 'long'
            }).toUpperCase();
            break;
            
        default:
            fechaLabel.textContent = 'Fecha';
            fecha.value = '';
    }
}

// Modify the category change event listener to handle async function
document.getElementById('categoria').addEventListener('change', function() {
    updateModeAndDate();
    document.getElementById("errorCategoria").style.display = "none";
});

// Also update when tipo changes
document.getElementById('tipoInventario').addEventListener('change', function() {
    // First clear the mode and date
    document.getElementById('modo').value = '';
    document.getElementById('fecha').value = '';
    // Then let the categoria change handler update them if a category is selected
});
// Mostrar mensaje de error
function mostrarError(id) {
    document.getElementById(id).style.display = "block";
    return false;
}

// Validar el formulario
function validarFormulario() {
    let esValido = true;
    const tipo = document.getElementById("tipoInventario").value;
    const categoria = document.getElementById("categoria").value;
    const responsable = document.getElementById("responsable").value;
    const modo = document.getElementById("modo").value;
    const fecha = document.getElementById("fecha").value;

    // Ocultar todos los mensajes de error
    document.querySelectorAll('.error-message').forEach(el => el.style.display = "none");

    // Validar cada campo
    if (!tipo) esValido = mostrarError("errorTipo");
    if (!categoria) esValido = mostrarError("errorCategoria");
    if (!responsable.trim()) esValido = mostrarError("errorResponsable");
    if (!modo) esValido = mostrarError("errorModo");
    if (!fecha) esValido = mostrarError("errorFecha");

    return esValido;
}

// Continuar con el proceso
function continuar() {
    if (!validarFormulario()) return;

    const tipo = document.getElementById("tipoInventario").value;
    const categoria = document.getElementById("categoria").value;
    const responsable = document.getElementById("responsable").value;
    const modo = document.getElementById("modo").value;
    const fecha = document.getElementById("fecha").value;

    // Mostrar modal de confirmación con los detalles
    document.getElementById("modalContent").innerHTML = `
        <p><strong>Tipo de Inventario:</strong> ${tipo}</p>
        <p><strong>Categoría:</strong> ${categoria}</p>
        <p><strong>Responsable:</strong> ${responsable}</p>
        <p><strong>Modo:</strong> ${modo}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
    `;
    document.getElementById("modalConfirmacion").style.display = "flex";
}

// Confirmar y continuar
function confirmarContinuar() {
    const tipo = document.getElementById("tipoInventario").value;
    const categoria = document.getElementById("categoria").value;
    const responsable = document.getElementById("responsable").value;
    const modo = document.getElementById("modo").value;
    const fecha = document.getElementById("fecha").value;

    // Crear URL con parámetros
    const params = new URLSearchParams({
        tipo,
        categoria,
        responsable,
        modo,
        fecha
    });

    // Redirigir a formulario.html con parámetros
    window.location.replace(`formulario.html?${params.toString()}`);
}

// Confirmar salida y cerrar sesión
function confirmarSalir() {
    localStorage.removeItem('userSession');
    window.location.replace('index.html');
}

// Cerrar cualquier modal
function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}
