// URL de la API
const API_URL = 'https://script.google.com/macros/s/AKfycbzkvqnflAjsYuXlmB4N7SRQjUQruEFmjtY57L-VC-bVTFKrek9B-Jrp-JdCp-M_FZcR/exec';

// Variables globales
let inventoryData = [];
let currentItemToDelete = null;
let sidebarOpen = false; // Variable para controlar el estado del panel lateral

// Elementos DOM
const loader = document.getElementById('loader');
const inventoryBody = document.getElementById('inventoryBody');
const noResults = document.getElementById('noResults');
const articleModal = document.getElementById('articleModal');
const confirmModal = document.getElementById('confirmModal');
const articleForm = document.getElementById('articleForm');
const modalTitle = document.getElementById('modalTitle');
const closeBtn = document.querySelector('.close');
const btnCancelar = document.getElementById('btnCancelar');
const btnNuevoArticulo = document.getElementById('btnNuevoArticulo');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

// Variables para la edición del nombre del ítem
const editItemNameBtn = document.getElementById('editItemName');
const itemNameLabel = document.getElementById('modalItemId');
const itemNameEditContainer = document.getElementById('itemNameEdit');
const itemNameInput = document.getElementById('itemNameInput');

// Selectores de filtro
const filtroSede = document.getElementById('filtroSede');
const filtroTipo = document.getElementById('filtroTipo');
const filtroCategoria = document.getElementById('filtroCategoria');
const buscarItem = document.getElementById('buscarItem');

// Elementos del panel lateral
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const logoutBtn = document.getElementById('logoutBtn');
const mainContent = document.querySelector('.main-content');

// Evento que se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay una sesión activa
    const usuario = sessionStorage.getItem('usuario');
    if (!usuario) {
        window.location.href = '../login.html';
        return;
    }

    // Mostrar nombre del usuario
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = usuario;
    }
    
    // Cargar datos iniciales
    fetchInventoryData();
    
    // Configurar eventos
    setupEventListeners();
    
    // Configurar eventos del panel lateral
    setupSidebarEvents();
    
    // Verificar si existe un modal antiguo para reemplazarlo
    const oldModal = document.getElementById('articleModal');
    if (oldModal) {
        // Si ya existe, podríamos simplemente actualizar sus clases y estructura
        // o reemplazarlo completamente por el nuevo código HTML
        
        // Agregar los nuevos eventos al modal existente
        const editItemBtn = document.createElement('div');
        editItemBtn.className = 'edit-item-icon';
        editItemBtn.id = 'editItemName';
        editItemBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        
        const itemNameEdit = document.createElement('div');
        itemNameEdit.className = 'item-name-edit';
        itemNameEdit.id = 'itemNameEdit';
        itemNameEdit.innerHTML = '<input type="text" id="itemNameInput" placeholder="Nombre del artículo">';
        
        // Buscar donde insertar estos elementos
        const modalItemId = document.getElementById('modalItemId');
        if (modalItemId && modalItemId.parentNode) {
            modalItemId.parentNode.appendChild(editItemBtn);
            modalItemId.parentNode.appendChild(itemNameEdit);
        }
    }
    
    // Configurar evento para editar el nombre del ítem si existe el botón
    if (editItemNameBtn) {
        editItemNameBtn.addEventListener('click', () => {
            // Obtener el valor actual del nombre
            const currentItemName = itemNameLabel.textContent;
            
            // Establecer el valor en el campo de entrada
            itemNameInput.value = currentItemName;
            
            // Mostrar el campo de edición y ocultar la etiqueta
            itemNameLabel.style.display = 'none';
            itemNameEditContainer.style.display = 'block';
            editItemNameBtn.style.display = 'none';
            
            // Enfocar en el campo de entrada
            itemNameInput.focus();
            
            // Configurar evento para guardar al presionar Enter
            itemNameInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    saveItemName();
                }
            });
            
            // Configurar evento para guardar al perder el foco
            itemNameInput.addEventListener('blur', saveItemName);
        });
    }
});

// Función para cargar los datos de inventario desde la API
function fetchInventoryData() {
    loader.style.display = 'flex';
    noResults.style.display = 'none';

    fetch(`${API_URL}?api=articulos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data); // Para depuración

            if (data && data.data && Array.isArray(data.data)) {
                inventoryData = data.data.map(item => ({
                    id: item.id || '',
                    ITEM: item.ITEM || item.item || '',
                    TIPO: item.TIPO || item.tipo || '',
                    CATEGORIA: item.CATEGORIA || item.categoria || '',
                    MODO: item.MODO || item.modo || '',
                    MODELO: item.MODELO || item.modelo || '',
                    SEDE: item.SEDE || item.sede || '',
                    ESTADO: item.ESTADO || item.estado || 'ACTIVO',
                    TOPE_MINIMO: item.MINIMO || item.minimo || '',
                    TOPE_MAXIMO: item.MAXIMO || item.maximo || '',
                    RESPONSABLE: item.RESPONSABLE || item.responsable || '',
                    FECHAMOD: item.FECHAMOD || item.fechamod || '',
                    HORAMOD: item.HORAMOD || item.horamod || ''
                }));

                if (window.listas) {
                    window.listas.actualizarListasDesdeDatos(inventoryData);
                }

                populateTable(inventoryData);
                populateFilters(inventoryData);
                setupTableSorting();
            } else {
                console.error('Formato de datos inesperado:', data);
                showNoResults('No se pudieron cargar los datos');
            }
        })
        .catch(error => {
            console.error('Error al obtener datos:', error);
            showNoResults('Error al cargar los datos: ' + error.message);
        })
        .finally(() => {
            loader.style.display = 'none';
        });
}



// Función para guardar el nombre del ítem
function saveItemName() {
    const newName = itemNameInput.value.trim();
    
    if (newName !== '') {
        // Actualizar la etiqueta con el nuevo nombre
        itemNameLabel.textContent = newName;
        
        // Actualizar también el campo de ítem en el formulario
        document.getElementById('item').value = newName;
        
        // Ocultar el campo de edición y mostrar la etiqueta
        itemNameLabel.style.display = 'inline-block';
        itemNameEditContainer.style.display = 'none';
        editItemNameBtn.style.display = 'flex';
    }
}

// Función para configurar eventos del panel lateral
function setupSidebarEvents() {
    // Evento para mostrar/ocultar el panel lateral
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Cerrar el panel al hacer clic en el overlay
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Cerrar el panel al hacer clic en un enlace (en dispositivos móviles)
    const sidebarLinks = sidebar.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Solo cerrar en dispositivos móviles
            if (window.innerWidth < 992) {
                closeSidebar();
            }
        });
    });
    
    // Evento para el botón de cerrar sesión
    logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            sessionStorage.removeItem('usuario');
            window.location.href = '../login.html';
        }
    });
}

// Función para mostrar/ocultar el panel lateral
function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('open', sidebarOpen);
    sidebarOverlay.classList.toggle('open', sidebarOpen);
    
    // Remove this line to prevent content shifting
    // mainContent.classList.toggle('shifted', sidebarOpen);
    
    // Just toggle the body class for overlay purposes
    document.body.classList.toggle('sidebar-open', sidebarOpen);
}

// Función para cerrar el panel lateral
function closeSidebar() {
    sidebarOpen = false;
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
    
    // Remove this line to prevent content shifting
    // mainContent.classList.remove('shifted');
    
    document.body.classList.remove('sidebar-open');
}

// Función para cargar los datos de inventario desde la API


// Función para formatear fecha de ddMMyyyy a dd/MM/yyyy
function formatFecha(fechaStr) {
    // Convertir a string si es un número
    if (typeof fechaStr === 'number') {
        fechaStr = fechaStr.toString();
    }
    
    if (!fechaStr || fechaStr.length !== 8) return 'No especificado';
    
    try {
        const dia = fechaStr.substring(0, 2);
        const mes = fechaStr.substring(2, 4);
        const año = fechaStr.substring(4, 8);
        return `${dia}/${mes}/${año}`;
    } catch (error) {
        console.error('Error al formatear fecha:', error, fechaStr);
        return fechaStr;
    }
}

// Función para formatear hora de HHmm a HH:mm
function formatHora(horaStr) {
    // Convertir a string si es un número
    if (typeof horaStr === 'number') {
        horaStr = horaStr.toString();
    }
    
    if (!horaStr) return 'No especificado';
    
    try {
        // Pad with zeros to ensure 4 digits
        horaStr = horaStr.padStart(4, '0');
        
        const hora = parseInt(horaStr.slice(0, 2));
        const minutos = horaStr.slice(-2);
        
        // For 3-digit times, adjust the parsing
        if (horaStr.length === 3) {
            return `${horaStr[0]}:${horaStr.slice(1)}`;
        }
        
        return `${hora}:${minutos}`;
    } catch (error) {
        console.error('Error al formatear hora:', error, horaStr);
        return horaStr;
    }
}

// Función para popular la tabla con los datos
function populateTable(data) {
    if (!data || data.length === 0) {
        showNoResults();
        return;
    }

    noResults.style.display = 'none';
    inventoryBody.innerHTML = '';

    data.forEach((item, index) => {
        // Fila principal con la información básica
        const row = document.createElement('tr');
        row.dataset.id = item.id || index;
        
        // Formatear la sede: si es "ALL", mostrar "AMBAS"
        const sedeFormateada = (item.SEDE === 'ALL') ? 'AMBAS' : (item.SEDE || '-');
        
        row.innerHTML = `
            <td>${item.ITEM || '-'}</td>
            <td>${item.TIPO || '-'}</td>
            <td>${item.CATEGORIA || '-'}</td>
            <td>${item.MODO || '-'}</td>
            <td>${item.MODELO || '-'}</td>
            <td>${sedeFormateada}</td>
            <td>
                <span class="status-badge ${item.ESTADO === 'ACTIVO' ? 'status-active' : 'status-inactive'}">
                    ${item.ESTADO || 'N/A'}
                </span>
            </td>
            <td>
                <div class="item-actions">
                    <button class="action-btn view-btn" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Editar artículo">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Eliminar artículo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        inventoryBody.appendChild(row);
        
        // Fila de detalles (inicialmente oculta)
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.dataset.parentId = item.id || index;

        detailsRow.innerHTML = `
            <td colspan="8">
                <div class="details-content">
                    <div class="detail-item">
                        <span class="detail-label">TOPE MÍNIMO:</span>
                        <span class="detail-value">${item.MINIMO || item.TOPE_MINIMO || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">TOPE MÁXIMO:</span>
                        <span class="detail-value">${item.MAXIMO || item.TOPE_MAXIMO || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">RESPONSABLE:</span>
                        <span class="detail-value">${item.RESPONSABLE || item.responsable || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">FECHA MODIFICACIÓN:</span>
                        <span class="detail-value">${formatFecha(item.FECHAMOD || item.fechamod) || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">HORA MODIFICACIÓN:</span>
                        <span class="detail-value">${formatHora(item.HORAMOD || item.horamod) || 'No especificado'}</span>
                    </div>
                </div>
            </td>
        `;
        
        inventoryBody.appendChild(detailsRow);
        
        // Configurar el botón para mostrar/ocultar detalles
        const viewBtn = row.querySelector('.view-btn');
        viewBtn.addEventListener('click', () => toggleDetails(item.id || index));
        
        // Configurar el botón de edición
        const editBtn = row.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => openEditModal(item));
        
        // Configurar el botón de eliminación
        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => openDeleteConfirmation(item));
    });
}

// Función para mostrar u ocultar detalles
function toggleDetails(id) {
    const detailsRow = document.querySelector(`.details-row[data-parent-id="${id}"]`);
    if (detailsRow) {
        const isVisible = detailsRow.style.display === 'table-row';
        detailsRow.style.display = isVisible ? 'none' : 'table-row';
    }
}

// Función para filtrar los datos según los criterios seleccionados
function filterData() {
    const sede = filtroSede.value.toLowerCase();
    const tipo = filtroTipo.value.toLowerCase();
    const categoria = filtroCategoria.value.toLowerCase();
    const itemText = buscarItem.value.toLowerCase().trim();
    
    const filteredData = inventoryData.filter(item => {
        const matchSede = !sede || (item.SEDE && item.SEDE.toLowerCase().includes(sede));
        const matchTipo = !tipo || (item.TIPO && item.TIPO.toLowerCase().includes(tipo));
        const matchCategoria = !categoria || (item.CATEGORIA && item.CATEGORIA.toLowerCase().includes(categoria));
        const matchItem = !itemText || (item.ITEM && item.ITEM.toLowerCase().includes(itemText));
        
        return matchSede && matchTipo && matchCategoria && matchItem;
    });
    
    populateTable(filteredData);
    
    if (filteredData.length === 0) {
        showNoResults();
    }
}

// Función para mostrar mensaje de "no se encontraron resultados"
function showNoResults(customMessage = 'No se encontraron resultados con los filtros aplicados') {
    inventoryBody.innerHTML = '';
    noResults.style.display = 'block';
    noResults.querySelector('p').textContent = customMessage;
}

// Función para popular los selectores de filtro con valores únicos
function populateFilters(data) {
    try {
        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid data provided');
        }

        // Actualizar las listas si el módulo está disponible
        if (window.listas && typeof window.listas.actualizarListasDesdeDatos === 'function') {
            window.listas.actualizarListasDesdeDatos(data);
        }

        // Inicializar los filtros directamente
        const sedes = new Set();
        const tipos = new Set();
        const categorias = new Set();
        
        data.forEach(item => {
            if (item.SEDE) sedes.add(item.SEDE);
            if (item.TIPO) tipos.add(item.TIPO);
            if (item.CATEGORIA) categorias.add(item.CATEGORIA);
        });
        
        // Populate filter dropdowns
        filtroSede.innerHTML = '<option value="">Todas</option>';
        filtroTipo.innerHTML = '<option value="">Todos</option>';
        filtroCategoria.innerHTML = '<option value="">Todas</option>';
        
        sedes.forEach(sede => {
            const option = document.createElement('option');
            option.value = sede;
            option.textContent = sede === 'ALL' ? 'AMBAS' : sede;
            filtroSede.appendChild(option);
        });
        
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            filtroTipo.appendChild(option);
        });
        
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            filtroCategoria.appendChild(option);
        });
    } catch (error) {
        console.error('Error initializing filters:', error);
    }
}

// Función mejorada para abrir el modal de edición con los datos del artículo
function openEditModal(item) {
    modalTitle.textContent = 'Editar Artículo';
    
    // Obtener referencias a los elementos del DOM
    const itemNameLabel = document.getElementById('modalItemId');
    const itemNameEdit = document.getElementById('itemNameEdit');
    const editItemNameBtn = document.getElementById('editItemName');
    const itemNameInput = document.getElementById('itemNameInput');

    // Validar que todos los elementos necesarios existan
    if (!itemNameLabel || !itemNameEdit || !editItemNameBtn || !itemNameInput) {
        console.error('Elementos del DOM no encontrados para la edición del nombre');
        return;
    }

    // Establecer el nombre actual y configurar la visualización inicial
    itemNameLabel.textContent = item.ITEM || 'Nuevo Artículo';
    itemNameLabel.style.display = 'inline-block';
    itemNameEdit.style.display = 'none';
    editItemNameBtn.style.display = 'inline-block';

    // Remover eventos anteriores para evitar duplicados
    const newEditBtn = editItemNameBtn.cloneNode(true);
    editItemNameBtn.parentNode.replaceChild(newEditBtn, editItemNameBtn);

    // Configurar el nuevo evento de clic
    newEditBtn.onclick = function() {
        itemNameInput.value = itemNameLabel.textContent;
        itemNameLabel.style.display = 'none';
        itemNameEdit.style.display = 'block';
        newEditBtn.style.display = 'none';
        itemNameInput.focus();

        // Configurar eventos para guardar
        const handleSave = () => {
            const newName = itemNameInput.value.trim();
            if (newName) {
                itemNameLabel.textContent = newName;
                document.getElementById('item').value = newName;
                itemNameLabel.style.display = 'inline-block';
                itemNameEdit.style.display = 'none';
                newEditBtn.style.display = 'inline-block';
            }
        };

        itemNameInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            }
        };

        itemNameInput.onblur = handleSave;
    };

    // Safely set values with null checks
    const setElementValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    };

    const setElementText = (id, text) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    };

    const setElementDisplay = (id, display) => {
        const element = document.getElementById(id);
        if (element) element.style.display = display;
    };

    // Set modal header information
    setElementText('modalItemId', item.ITEM || '');
    setElementDisplay('modalItemId', 'inline-block');
    
    // Set responsable information
    const responsableSesion = sessionStorage.getItem('usuario') || 'Usuario';
    setElementText('modalResponsable', 'Responsable: ' + responsableSesion);
    setElementDisplay('modalResponsable', 'block');

    // Set status badge
    const statusBadge = document.getElementById('modalStatusBadge');
    if (statusBadge) {
        statusBadge.style.display = 'inline-block';
        statusBadge.textContent = item.ESTADO || 'ACTIVO';
        statusBadge.className = 'modal-status-badge ' + (item.ESTADO === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO');
    }

    // Set form values
    setElementValue('articleId', item.id || '');
    setElementValue('item', item.ITEM || '');
    setElementValue('topeMinimo', item.MINIMO || item.minimo || '');
    setElementValue('topeMaximo', item.MAXIMO || item.maximo || '');
    setElementValue('responsable', responsableSesion);
    setElementValue('estado', item.ESTADO || 'ACTIVO');
    
    // Show modal header info
    const modalHeaderInfo = document.querySelector('.modal-header-info');
    if (modalHeaderInfo) modalHeaderInfo.style.display = 'flex';
    
    // Initialize selectors if listas module is available
    if (window.listas && typeof window.listas.inicializarSelectores === 'function') {
        const valoresArticulo = {
            sede: item.SEDE || '',
            tipo: item.TIPO || '',
            categoria: item.CATEGORIA || '',
            modo: item.MODO || '',
            modelo: item.MODELO || '',
            estado: item.ESTADO || 'ACTIVO'
        };
        window.listas.inicializarSelectores(valoresArticulo);
    }
    
    // Show modal
    if (articleModal) articleModal.style.display = 'block';
    
    // Set name editing mode
    if (itemNameLabel) itemNameLabel.style.display = 'inline-block';
    if (itemNameEditContainer) itemNameEditContainer.style.display = 'none';
    if (editItemNameBtn) editItemNameBtn.style.display = 'flex';
    
    // Adjust modal size
    ajustarTamanoModal();
}

// Función mejorada para abrir el modal de nuevo artículo
function abrirModalNuevoArticulo() {
    // Limpiar el formulario
    articleForm.reset();
    
    // Establecer el título del modal
    document.getElementById('modalTitle').textContent = 'Nuevo Artículo';
    
    // Mostrar contenedor de ítem
    document.querySelector('.item-container').style.display = 'block';
    document.getElementById('modalItemId').textContent = 'Nuevo Artículo';
    
    // Obtener el usuario actual para mostrar como responsable
    const responsableSesion = sessionStorage.getItem('usuario') || 'Usuario';
    document.getElementById('modalResponsable').textContent = 'Responsable: ' + responsableSesion;
    document.getElementById('modalResponsable').style.display = 'block';
    
    // Mostrar estado como ACTIVO por defecto para nuevos artículos
    const statusBadge = document.getElementById('modalStatusBadge');
    statusBadge.textContent = 'ACTIVO';
    statusBadge.className = 'modal-status-badge ACTIVO';
    statusBadge.style.display = 'inline-block';
    
    document.querySelector('.modal-header-info').style.display = 'flex';
    
    // Limpiar el ID oculto
    document.getElementById('articleId').value = '';
    document.getElementById('responsable').value = responsableSesion;
    document.getElementById('estado').value = 'ACTIVO';
    
    // Initialize selectors safely
    if (window.listas && typeof window.listas.inicializarSelectores === 'function') {
        window.listas.inicializarSelectores();
    } else {
        // Fallback: Clear all selector values
        const selectors = ['sede', 'tipo', 'categoria', 'modo', 'modelo'];
        selectors.forEach(id => {
            const selector = document.getElementById(id);
            if (selector) selector.value = '';
        });
    }
    
    // Show modal
    articleModal.style.display = 'block';
    
    // Adjust modal size
    ajustarTamanoModal();
}

// Ajustar el tamaño del modal
function ajustarTamanoModal() {
    const modalContent = document.querySelector('.modal-content');
    const modalHeader = document.querySelector('.modal-header');
    const modalBody = document.querySelector('.modal-body');
    const formActions = document.querySelector('.form-actions');
    
    // Resetear estilos para medir correctamente
    modalBody.style.maxHeight = '';
    modalContent.style.maxHeight = '';
    
    // Esperar a que el DOM se actualice
    setTimeout(() => {
        const windowHeight = window.innerHeight;
        const headerHeight = modalHeader.offsetHeight;
        const actionsHeight = formActions.offsetHeight;
        const padding = 40; // Espacio para márgenes y padding
        
        // Calcular altura máxima disponible para el cuerpo
        const maxBodyHeight = windowHeight - headerHeight - actionsHeight - padding;
        
        // Aplicar alturas máximas
        modalBody.style.maxHeight = `${maxBodyHeight}px`;
        modalContent.style.maxHeight = `${windowHeight - padding}px`;
        modalContent.style.margin = '20px auto';
        
        // Asegurar que el contenido sea scrolleable si es necesario
        modalBody.style.overflowY = 'auto';
    }, 10);
}

// Evento para ajustar el modal cuando cambia el tamaño de la ventana
window.addEventListener('resize', () => {
    if (articleModal.style.display === 'block') {
        ajustarTamanoModal();
    }
});

// Configurar eventos
function setupEventListeners() {
    // Configurar eventos para el modal de confirmación
    btnConfirmDelete.addEventListener('click', deleteItem);
    btnCancelDelete.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    
    // Cerrar modal de confirmación al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
    
    // Configurar eventos de filtro
    filtroSede.addEventListener('change', filterData);
    filtroTipo.addEventListener('change', filterData);
    filtroCategoria.addEventListener('change', filterData);
    buscarItem.addEventListener('input', filterData);
    
    // Configurar botón para limpiar filtros
    btnLimpiarFiltros.addEventListener('click', () => {
        filtroSede.value = '';
        filtroTipo.value = '';
        filtroCategoria.value = '';
        buscarItem.value = '';
        filterData();
    });
    
    // Añadir evento para cerrar el modal
    closeBtn.addEventListener('click', () => {
        articleModal.style.display = 'none';
    });
    
    btnCancelar.addEventListener('click', () => {
        articleModal.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
        if (event.target === articleModal) {
            articleModal.style.display = 'none';
        }
    });
    
    // Configurar el formulario
    articleForm.addEventListener('submit', handleFormSubmit);
    
    // Configurar evento para el botón de nuevo artículo
    if (btnNuevoArticulo) {
        btnNuevoArticulo.addEventListener('click', abrirModalNuevoArticulo);
    }
}

// Modificar la función de envío del formulario para realizar la petición real a la API
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Obtener el usuario actual
    const responsableSesion = sessionStorage.getItem('usuario');
    if (!responsableSesion) {
        alert('Error: No hay una sesión activa');
        window.location.href = '../login.html';
        return;
    }
    
    // Obtener los valores del formulario
    const articleId = document.getElementById('articleId').value;
    const sede = document.getElementById('sede').value;
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const modo = document.getElementById('modo').value;
    const modelo = document.getElementById('modelo').value;
    const item = document.getElementById('item').value;
    const minimo = document.getElementById('minimo').value;
    const maximo = document.getElementById('maximo').value;
    const estado = document.getElementById('estado').value;
    
    // Preparar el objeto de artículo para enviar usando responsableSesion
    const articulo = {
        sede: sede,
        tipo: tipo,
        categoria: categoria,
        modo: modo,
        modelo: modelo,
        item: item,
        minimo: minimo,
        maximo: maximo,
        estado: estado,
        responsable: responsableSesion // Using session user as responsable
    };
    
    // Solo incluir el ID si estamos editando y el ID existe y no está vacío
    if (articleId && articleId.trim() !== '') {
        articulo.id = articleId;
    }
    
    // Crear el objeto de solicitud
    let requestData;
    
    // Si es una edición, incluir el ID en el objeto principal
    if (articleId && articleId.trim() !== '') {
        requestData = {
            api: 'articulos',
            accion: 'guardar',
            articulo: articulo,
            id: articleId // Incluir el ID también en el objeto principal
        };
    } else {
        // Si es nuevo, no incluir ningún campo ID
        requestData = {
            api: 'articulos',
            accion: 'guardar',
            articulo: articulo
        };
    }
    
    // Mostrar loader
    loader.style.display = 'flex';
    
    try {
        // Realizar la petición a la API con el formato correcto
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor: ' + response.status);
        }

        const data = await response.json();
        
        // Verificar si la operación fue exitosa
        if (data && data.success) {
            // Cerrar el modal de artículo
            articleModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            
            // Mostrar modal de éxito con mensaje apropiado
            const mensaje = articleId 
                ? 'El artículo ha sido actualizado correctamente.' 
                : 'El artículo ha sido creado correctamente.';
            mostrarModalExito(mensaje);
            
            // Recargar los datos para actualizar la tabla
            fetchInventoryData();
        } else {
            // Mostrar mensaje de error específico si viene del servidor
            if (data && data.message) {
                alert('Error: ' + data.message);
            } else {
                alert('Error al guardar el artículo');
            }
        }
    } catch (error) {
        console.error('Error al guardar el artículo:', error);
        alert('Error al guardar el artículo: ' + error.message);
    } finally {
        // Ocultar loader
        loader.style.display = 'none';
    }
}

// Función para abrir el modal de confirmación de eliminación
function openDeleteConfirmation(item) {
    currentItemToDelete = item;
    confirmModal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Mostrar información del artículo a eliminar
    const confirmMessage = document.getElementById('confirmMessage');
    if (confirmMessage) {
        confirmMessage.innerHTML = `¿Estás seguro de que deseas eliminar el artículo <strong>${item.ITEM || 'seleccionado'}</strong>?<br>Esta acción no se puede deshacer.`;
    }
}

// Función para eliminar un artículo
async function deleteItem() {
    if (!currentItemToDelete || !currentItemToDelete.id) {
        alert('Error: No se ha seleccionado un artículo válido para eliminar');
        confirmModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        return;
    }
    
    // Mostrar loader
    loader.style.display = 'flex';
    
    // Cerrar el modal de confirmación
    confirmModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    
    try {
        // Preparar datos para la solicitud
        const requestData = {
            api: 'articulos',
            accion: 'eliminar',
            id: currentItemToDelete.id
        };
        
        // Realizar la petición a la API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor: ' + response.status);
        }
        
        const data = await response.json();
        
        // Verificar si la operación fue exitosa
        if (data && data.success) {
            // Mostrar mensaje de éxito
            mostrarModalExito('El artículo ha sido eliminado correctamente.');
            
            // Recargar los datos para actualizar la tabla
            fetchInventoryData();
        } else {
            // Mostrar mensaje de error específico si viene del servidor
            if (data && data.message) {
                alert('Error: ' + data.message);
            } else {
                alert('Error al eliminar el artículo');
            }
        }
    } catch (error) {
        console.error('Error al eliminar el artículo:', error);
        alert('Error al eliminar el artículo: ' + error.message);
    } finally {
        // Ocultar loader
        loader.style.display = 'none';
        // Limpiar el artículo seleccionado
        currentItemToDelete = null;
    }
}

// Función para mostrar el modal de éxito
function mostrarModalExito(mensaje = 'Operación completada con éxito') {
    // Actualizar el mensaje
    const successMessage = document.getElementById('successMessage');
    const successDetails = document.getElementById('successDetails');
    
    if (successMessage) successMessage.textContent = '¡Éxito!';
    if (successDetails) successDetails.textContent = mensaje;
    
    // Mostrar el modal
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Configurar cierre automático después de 2 segundos
        setTimeout(() => {
            cerrarModalExito();
        }, 2000);
    }
}

// Función para cerrar el modal de éxito
function cerrarModalExito() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

// Función para configurar la ordenación de la tabla
function setupTableSorting() {
    const tableHeaders = document.querySelectorAll('.inventory-table th[data-sort]');
    
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Obtener la columna a ordenar
            const sortBy = header.dataset.sort;
            
            // Determinar la dirección de ordenación
            let sortDirection = 'asc';
            if (header.classList.contains('sort-asc')) {
                sortDirection = 'desc';
                header.classList.remove('sort-asc');
                header.classList.add('sort-desc');
            } else if (header.classList.contains('sort-desc')) {
                header.classList.remove('sort-desc');
            } else {
                header.classList.add('sort-asc');
            }
            
            // Quitar clases de ordenación de otros encabezados
            tableHeaders.forEach(th => {
                if (th !== header) {
                    th.classList.remove('sort-asc', 'sort-desc');
                }
            });
            
            // Ordenar los datos
            sortInventoryData(sortBy, sortDirection);
        });
    });
}

// Función para ordenar los datos de inventario
function sortInventoryData(sortBy, direction) {
    // Crear una copia de los datos para no modificar el original
    const sortedData = [...inventoryData];
    
    // Ordenar los datos
    sortedData.sort((a, b) => {
        let valueA = a[sortBy] || '';
        let valueB = b[sortBy] || '';
        
        // Convertir a minúsculas si son strings
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        
        // Comparar valores
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Actualizar la tabla con los datos ordenados
    populateTable(sortedData);
}

// Función para exportar datos a Excel
function exportToExcel() {
    // Verificar si hay datos para exportar
    if (!inventoryData || inventoryData.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Preparar los datos para la exportación
    const dataToExport = inventoryData.map(item => {
        return {
            'ITEM': item.ITEM || '',
            'TIPO': item.TIPO || '',
            'CATEGORÍA': item.CATEGORIA || '',
            'MODO': item.MODO || '',
            'MODELO': item.MODELO || '',
            'SEDE': item.SEDE || '',
            'ESTADO': item.ESTADO || '',
            'TOPE MÍNIMO': item.MINIMO || item.minimo || '',
            'TOPE MÁXIMO': item.MAXIMO || item.maximo || '',
            'RESPONSABLE': item.RESPONSABLE || item.responsable || '',
            'FECHA MODIFICACIÓN': formatFecha(item.FECHAMOD || item.fechamod) || '',
            'HORA MODIFICACIÓN': formatHora(item.HORAMOD || item.horamod) || ''
        };
    });
    
    // Crear una hoja de cálculo con los datos
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    
    // Generar el archivo Excel y descargarlo
    const fechaActual = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Inventario_${fechaActual}.xlsx`);
}

// Función para imprimir la tabla de inventario
function printInventory() {
    // Crear una ventana para imprimir
    const printWindow = window.open('', '_blank');
    
    // Crear el contenido HTML para imprimir
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventario - ${new Date().toLocaleDateString()}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
                .status-active { color: green; }
                .status-inactive { color: red; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 0; padding: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Reporte de Inventario</h1>
                <p>Fecha: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ITEM</th>
                        <th>TIPO</th>
                        <th>CATEGORÍA</th>
                        <th>MODO</th>
                        <th>MODELO</th>
                        <th>SEDE</th>
                        <th>ESTADO</th>
                        <th>TOPE MÍN</th>
                        <th>TOPE MÁX</th>
                        <th>RESPONSABLE</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Agregar filas de datos
    inventoryData.forEach(item => {
        const sedeFormateada = (item.SEDE === 'ALL') ? 'AMBAS' : (item.SEDE || '-');
        const estadoClass = item.ESTADO === 'ACTIVO' ? 'status-active' : 'status-inactive';
        
        printContent += `
            <tr>
                <td>${item.ITEM || '-'}</td>
                <td>${item.TIPO || '-'}</td>
                <td>${item.CATEGORIA || '-'}</td>
                <td>${item.MODO || '-'}</td>
                <td>${item.MODELO || '-'}</td>
                <td>${sedeFormateada}</td>
                <td class="${estadoClass}">${item.ESTADO || 'N/A'}</td>
                <td>${item.MINIMO || item.minimo || '-'}</td>
                <td>${item.MAXIMO || item.maximo || '-'}</td>
                <td>${item.RESPONSABLE || item.responsable || '-'}</td>
            </tr>
        `;
    });
    
    // Cerrar el HTML
    printContent += `
                </tbody>
            </table>
            <div class="no-print">
                <button onclick="window.print()">Imprimir</button>
                <button onclick="window.close()">Cerrar</button>
            </div>
        </body>
        </html>
    `;
    
    // Escribir el contenido en la ventana de impresión
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Esperar a que se cargue el contenido antes de imprimir
    printWindow.onload = function() {
        printWindow.focus();
        // Imprimir automáticamente
        // printWindow.print();
    };
}

// Agregar evento para bloquear el scroll cuando el modal está abierto
function toggleBodyScroll(isModalOpen) {
    if (isModalOpen) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
}

// Observador de mutaciones para detectar cuando se muestra/oculta un modal
const observeModals = () => {
    const modals = [articleModal, confirmModal];
    
    modals.forEach(modal => {
        // Observar cambios en el estilo display
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    const isVisible = modal.style.display === 'block';
                    toggleBodyScroll(isVisible);
                }
            });
        });
        
        // Configurar el observador
        observer.observe(modal, { attributes: true });
    });
};

// Iniciar observación de modales cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', observeModals);
