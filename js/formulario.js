const scriptURL = 'https://script.google.com/macros/s/AKfycbzkvqnflAjsYuXlmB4N7SRQjUQruEFmjtY57L-VC-bVTFKrek9B-Jrp-JdCp-M_FZcR/exec';
let datosUsuario = {};
let listaItems = [];
let indexItem = 0;

window.onload = async function() {
  const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
  if (!userSession.username) {
    window.location.href = 'ingreso.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  datosUsuario = {
    tipo: urlParams.get('tipo') || 'No especificado',
    categoria: urlParams.get('categoria') || 'No especificada',
    responsable: urlParams.get('responsable') || 'No especificado',
    fecha: urlParams.get('fecha') || new Date().toLocaleDateString(),
    sede: userSession.sede || 'No especificada',
    modo: urlParams.get('modo') || 'No especificada'
  };

  // Determine which logo to display based on sede
  let logoSrc = '';
  if (datosUsuario.sede.toUpperCase() === 'FILANDIA') {
    logoSrc = 'img/logoMP.png';
  } else if (datosUsuario.sede.toUpperCase() === 'SANTA ROSA') {
    logoSrc = 'img/logoSR.png';
  }

  // Add logo and user information to the info div with improved layout
  document.getElementById("info").innerHTML = `
    <div class="encabezado-flex">
      <div class="info-text">
        <strong>Tipo:</strong> ${datosUsuario.tipo}<br>
        <strong>Categoria:</strong> ${datosUsuario.categoria}<br>
        <strong>Responsable:</strong> ${datosUsuario.responsable}<br>
        <strong>Fecha:</strong> ${datosUsuario.fecha}<br>
        <strong>Sede:</strong> ${datosUsuario.sede}<br>
        <strong>Modo:</strong> ${datosUsuario.modo}
      </div>
      ${logoSrc ? `<div class="logo-container"><img src="${logoSrc}" alt="Logo ${datosUsuario.sede}" class="sede-logo"></div>` : ''}
    </div>
  `;

  // Cargar items directamente
  cargarItems();
};

// Función para validar si ya existe un inventario para los parámetros actuales
async function verificarInventarioExistente() {
  try {
    // Obtener la fecha actual en formato ddmmyyyy
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    const fechaBD = `${dia}${mes}${anio}`;
    
    // Construir la URL con parámetros para evitar problemas CORS
    const sede = encodeURIComponent(datosUsuario.sede.toUpperCase());
    const tipo = encodeURIComponent(datosUsuario.tipo.toUpperCase());
    const categoria = encodeURIComponent(datosUsuario.categoria.toUpperCase());
    const modo = encodeURIComponent(datosUsuario.modo.toUpperCase());
    
    // Construir URL base
    let url = `${scriptURL}?api=registros&accion=verificar&sede=${sede}&tipo=${tipo}&categoria=${categoria}&modo=${modo}`;
    
    // Calcular la fecha según el modo
    let fechaFiltro = new Date();
    
    if (modo === 'MENSUAL') {
        // Obtener el primer día del mes actual
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        // Obtener el último día del mes actual
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        
        // Formatear fechas como ddmmyyyy
        const inicioStr = `${String(inicioMes.getDate()).padStart(2, '0')}${String(inicioMes.getMonth() + 1).padStart(2, '0')}${inicioMes.getFullYear()}`;
        const finStr = `${String(finMes.getDate()).padStart(2, '0')}${String(finMes.getMonth() + 1).padStart(2, '0')}${finMes.getFullYear()}`;
        
        url += `&fechainicio=${encodeURIComponent(inicioStr)}&fechafin=${encodeURIComponent(finStr)}`;
    } else if (modo === 'SEMANAL') {
        // Obtener el domingo de la semana actual (inicio de la semana)
        const domingoActual = new Date(hoy);
        domingoActual.setDate(hoy.getDate() - hoy.getDay()); // Retroceder hasta el domingo
        
        // Obtener el sábado de la semana actual (fin de la semana)
        const sabadoActual = new Date(domingoActual);
        sabadoActual.setDate(domingoActual.getDate() + 6);
        
        // Formatear fechas como ddmmyyyy
        const inicioStr = `${String(domingoActual.getDate()).padStart(2, '0')}${String(domingoActual.getMonth() + 1).padStart(2, '0')}${domingoActual.getFullYear()}`;
        const finStr = `${String(sabadoActual.getDate()).padStart(2, '0')}${String(sabadoActual.getMonth() + 1).padStart(2, '0')}${sabadoActual.getFullYear()}`;
        
        url += `&fechainicio=${encodeURIComponent(inicioStr)}&fechafin=${encodeURIComponent(finStr)}`;
    } else if (modo === 'DIARIO') {
        fechaParam = fechaBD;
        url += `&fechabd=${encodeURIComponent(fechaParam)}`;
    }

    // Remove this section as it's causing duplicate parameters
    /*
    if (modo === 'DIARIO') {
        url += `&fechabd=${encodeURIComponent(fechaParam)}`;
    } else {
        url += `&fecha=${encodeURIComponent(fechaParam)}`;
    }
    */
    
    console.log("URL de verificación:", url);
    
    // Usar GET en lugar de POST para evitar problemas CORS
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache' // Evitar caché
    });
    
    if (!response.ok) {
      throw new Error(`Error de red: ${response.status} ${response.statusText}`);
    }
    
    const textoRespuesta = await response.text();
    console.log("Respuesta de verificación:", textoRespuesta);
    
    let data;
    try {
      data = JSON.parse(textoRespuesta);
    } catch (e) {
      console.error("Error al parsear respuesta:", textoRespuesta);
      throw new Error("Error al procesar la respuesta del servidor. Respuesta no válida.");
    }
    
    console.log("Datos procesados:", data);
    
    // IMPORTANT FIX: Check if there are any records directly from the response
    if (data.success && data.data && 
        ((data.data.data && data.data.data.length > 0) || 
         (Array.isArray(data.data) && data.data.length > 0))) {
      
      console.log("Inventario existente detectado directamente en la respuesta");
      
      // Get the records array from the correct location in the response
      const registros = data.data.data || data.data;
      
      // Get the first record (most recent)
      const ultimoRegistro = registros[0];
      console.log("Último registro encontrado:", ultimoRegistro);
      
      // Format date for display
      let formattedDate = "No disponible";
      if (ultimoRegistro.FECHABD) {
        formattedDate = `${ultimoRegistro.FECHABD.substring(0,2)}/${ultimoRegistro.FECHABD.substring(2,4)}/${ultimoRegistro.FECHABD.substring(4)}`;
      }
      
      // Generate appropriate waiting message based on mode
      let mensajeEspera = "";
      const modoInventario = datosUsuario.modo.toUpperCase();
      
      if (modoInventario === "DIARIO") {
        // For daily inventory, suggest tomorrow
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const diaManana = String(manana.getDate()).padStart(2, '0');
        const mesManana = String(manana.getMonth() + 1).padStart(2, '0');
        const anoManana = manana.getFullYear();
        mensajeEspera = `Debe esperar hasta mañana (${diaManana}/${mesManana}/${anoManana}) para crear un nuevo inventario DIARIO.`;
      } 
      else if (modoInventario === "SEMANAL") {
        // For weekly inventory, suggest next Monday
        const hoy = new Date();
        const diasHastaLunes = (1 + 7 - hoy.getDay()) % 7; // Calculate days until next Monday
        const proximoLunes = new Date();
        proximoLunes.setDate(hoy.getDate() + diasHastaLunes);
        
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const dia = String(proximoLunes.getDate()).padStart(2, '0');
        const mes = meses[proximoLunes.getMonth()];
        const ano = proximoLunes.getFullYear();
        mensajeEspera = `Debe esperar hasta el LUNES ${dia} de ${mes} de ${ano} para crear un nuevo inventario SEMANAL.`;
      } 
      else if (modoInventario === "MENSUAL") {
        // For monthly inventory, suggest first day of next month
        const hoy = new Date();
        const proximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const dia = String(proximoMes.getDate()).padStart(2, '0');
        const mes = meses[proximoMes.getMonth()];
        const ano = proximoMes.getFullYear();
        mensajeEspera = `Debe esperar hasta el ${dia} de ${mes} de ${ano} para crear un nuevo inventario MENSUAL.`;
      }
      
      // Return immediately with existe=true to block new inventory creation
      return {
        existe: true,
        mensaje: `Ya existe un inventario registrado para<br><br>
            <strong>TIPO:</strong> ${datosUsuario.tipo.toUpperCase()}<br>
            <strong>CATEGORÍA:</strong> ${datosUsuario.categoria.toUpperCase()}<br>
            <strong>SEDE:</strong> ${datosUsuario.sede.toUpperCase()}<br>
            <strong>FECHA:</strong> ${formattedDate}<br>
            <strong>RESPONSABLE:</strong> ${ultimoRegistro.RESPONSABLE || 'No especificado'}<br><br>
            ${mensajeEspera}`
      };
    }
    
    // Continue with the existing code for extracting records
    let registros = [];
    if (data.success && data.data) {
      // Handle both possible structures
      if (Array.isArray(data.data)) {
        registros = data.data;
      } else if (data.data.data && Array.isArray(data.data.data)) {
        registros = data.data.data;
      }
    }
    
    console.log("Registros extraídos:", registros);
    
    // Si hay registros que coinciden con estos criterios, verificamos si podemos crear uno nuevo según el modo
    if (registros.length > 0) {
      // Obtener la fecha del último registro
      const ultimoRegistro = registros[0]; // Asumimos que el primer registro es el más reciente
      console.log("Último registro encontrado:", ultimoRegistro);
      let fechaUltimoRegistro;
      
      // Intentar obtener la fecha del registro
      if (ultimoRegistro.FECHABD) {
        // Use FECHABD directly for comparison
        const fechaBD = ultimoRegistro.FECHABD;
        console.log("Fecha BD encontrada:", fechaBD);
        
        // Correct parsing for ddmmyyyy format
        fechaUltimoRegistro = new Date(
          parseInt(fechaBD.substring(4)), // año
          parseInt(fechaBD.substring(2, 4)) - 1, // mes (0-11)
          parseInt(fechaBD.substring(0, 2)) // día
        );
        
        // Fix: The year might be parsed incorrectly, ensure it's a 4-digit year
        if (fechaUltimoRegistro.getFullYear() < 100) {
          fechaUltimoRegistro.setFullYear(2000 + parseInt(fechaBD.substring(4)));
        }
        
        console.log("Fecha último registro parseada:", fechaUltimoRegistro);
      } else if (ultimoRegistro.FECHA) {
        // Formato esperado: dd/mm/yyyy
        const partesFecha = ultimoRegistro.FECHA.split('/');
        if (partesFecha.length === 3) {
          fechaUltimoRegistro = new Date(
            parseInt(partesFecha[2]), // año
            parseInt(partesFecha[1]) - 1, // mes (0-11)
            parseInt(partesFecha[0]) // día
          );
        }
      }

      // Si no se pudo obtener la fecha, usar la fecha actual
      if (!fechaUltimoRegistro || isNaN(fechaUltimoRegistro.getTime())) {
        console.warn("No se pudo determinar la fecha del último registro, usando fecha actual");
        fechaUltimoRegistro = new Date();
      }
      
      // Verificar si podemos crear un nuevo inventario según el modo
      const modoInventario = datosUsuario.modo.toUpperCase();
      let puedeCrear = false;
      let mensajeEspera = "";
      
      // Convert fechaUltimoRegistro to ddmmyyyy format for comparison
      const fechaUltimoStr = `${String(fechaUltimoRegistro.getDate()).padStart(2, '0')}${String(fechaUltimoRegistro.getMonth() + 1).padStart(2, '0')}${fechaUltimoRegistro.getFullYear()}`;
      const fechaActualStr = fechaBD; // Already in ddmmyyyy format
      
      if (modoInventario === "DIARIO") {
        // Compare using Date objects for accuracy instead of string comparison
        const hoyDate = new Date();
        hoyDate.setHours(0, 0, 0, 0);
        
        const ultimoRegistroDate = new Date(fechaUltimoRegistro);
        ultimoRegistroDate.setHours(0, 0, 0, 0);
        
        // Check if today's date is the same as the last record date
        puedeCrear = hoyDate.getTime() > ultimoRegistroDate.getTime();
        
        // Add debug logging
        console.log("Comparación de fechas (DIARIO):", {
          fechaHoy: hoyDate,
          fechaUltimoRegistro: ultimoRegistroDate,
          puedeCrear: puedeCrear
        });
        
        if (!puedeCrear) {
          const nextDate = new Date(ultimoRegistroDate);
          nextDate.setDate(nextDate.getDate() + 1);
          mensajeEspera = `Debe esperar hasta el ${nextDate.toLocaleDateString()} para crear un nuevo inventario DIARIO.`;
        }
      } else if (modoInventario === "SEMANAL") {
        // Obtener la fecha actual
        const hoyDate = new Date();
        
        // Obtener el domingo de la semana actual (el día que inicia la semana)
        const domingoActual = new Date(hoyDate);
        domingoActual.setDate(hoyDate.getDate() - hoyDate.getDay()); // Retroceder hasta el domingo
        domingoActual.setHours(0, 0, 0, 0); // Establecer a inicio del día
        
        // Obtener el domingo de la semana del último registro
        const domingoUltimoRegistro = new Date(fechaUltimoRegistro);
        domingoUltimoRegistro.setDate(fechaUltimoRegistro.getDate() - fechaUltimoRegistro.getDay());
        domingoUltimoRegistro.setHours(0, 0, 0, 0);
        
        // Add debug logging
        console.log("Comparación de fechas (SEMANAL):", {
          fechaHoy: hoyDate,
          domingoActual: domingoActual,
          fechaUltimoRegistro: fechaUltimoRegistro,
          domingoUltimoRegistro: domingoUltimoRegistro,
          puedeCrear: domingoActual.getTime() > domingoUltimoRegistro.getTime()
        });
        
        // Comparar los domingos: si son diferentes, significa que estamos en una semana diferente
        puedeCrear = domingoActual.getTime() > domingoUltimoRegistro.getTime();
        
        if (!puedeCrear) {
            // Calcular el próximo domingo (inicio de la próxima semana)
            const proximoDomingo = new Date(domingoUltimoRegistro);
            proximoDomingo.setDate(proximoDomingo.getDate() + 7);
            
            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            const proximoLunes = new Date(proximoDomingo);
            proximoLunes.setDate(proximoDomingo.getDate() + 1); // El lunes es el día siguiente al domingo
            
            const dia = String(proximoLunes.getDate()).padStart(2, '0');
            const mes = meses[proximoLunes.getMonth()];
            const ano = proximoLunes.getFullYear();
            mensajeEspera = `Debe esperar hasta el LUNES ${dia} de ${mes} de ${ano} para crear un nuevo inventario SEMANAL.`;
        }
      } else if (modoInventario === "MENSUAL") {
        // Obtener el primer día del próximo mes desde la última fecha
        const nextDate = new Date(fechaUltimoRegistro);
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(1);
        
        // Comparar con la fecha actual
        puedeCrear = hoy >= nextDate;
        if (!puedeCrear) {
          const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
          const dia = String(nextDate.getDate()).padStart(2, '0');
          const mes = meses[nextDate.getMonth()];
          const ano = nextDate.getFullYear();
          mensajeEspera = `Debe esperar hasta el ${dia} ${mes} de ${ano} para crear un nuevo inventario MENSUAL.`;
        }
      }
      
      // Si puede crear un nuevo inventario, retornar false
      if (puedeCrear) {
        return { existe: false };
      }
      
      // Format date for display
      const formattedDate = ultimoRegistro.FECHABD ? 
        `${ultimoRegistro.FECHABD.substring(0,2)}/${ultimoRegistro.FECHABD.substring(2,4)}/${ultimoRegistro.FECHABD.substring(4)}` :
        `${fechaUltimoStr.substring(0,2)}/${fechaUltimoStr.substring(2,4)}/${fechaUltimoStr.substring(4)}`;
      
      // Si no puede crear, mostrar mensaje de error
      return {
          existe: true,
          mensaje: `Ya existe un inventario registrado para<br><br>
              <strong>TIPO:</strong> ${datosUsuario.tipo.toUpperCase()}<br>
              <strong>CATEGORÍA:</strong> ${datosUsuario.categoria.toUpperCase()}<br>
              <strong>SEDE:</strong> ${datosUsuario.sede.toUpperCase()}<br>
              <strong>FECHA:</strong> ${formattedDate}<br>
              <strong>RESPONSABLE:</strong> ${ultimoRegistro.RESPONSABLE || 'No especificado'}<br><br>
              ${mensajeEspera}`
      };
    } else {
      return { existe: false };
    }
  } catch (error) {
    console.error("Error al verificar inventario existente:", error);
    throw new Error("Error al verificar si ya existe un inventario: " + error.message);
  }
}

// Función cargarItems modificada para incluir validación previa
async function cargarItems() {
  // Mostrar loader
  document.querySelector(".item-box").innerHTML = `
    <div class="form-container">
      <h3>Validando registros</h3>
      <div class='form-group text-center'>
        <p>Verificando registros previos...</p>
        <div class="loading-spinner"></div>
      </div>
    </div>`;

  try {
    // 1. Verificar si ya existe un inventario con esta configuración
    const verificacion = await verificarInventarioExistente();
    console.log("Resultado de verificación:", verificacion);
    
    // Ensure we properly check if an inventory exists
    if (verificacion && verificacion.existe === true) {
        console.log("Inventario existente detectado, mostrando mensaje de error");
        // Show as modal instead of throwing error
        mostrarInventarioExistente(verificacion.mensaje);
        // Reset the item-box to show a simple message
        document.querySelector(".item-box").innerHTML = `
            <div class="form-container">
                <h3>Verificación Completada</h3>
            </div>`;
        return; // Stop execution here
    }

    // 2. Si no hay registros, cargar items
    const response = await fetch(`${scriptURL}?api=articulos&tipo=${encodeURIComponent(datosUsuario.tipo)}&categoria=${encodeURIComponent(datosUsuario.categoria)}&sede=ALL,${encodeURIComponent(datosUsuario.sede)}`);
    const responseText = await response.text();
    console.log('Raw API response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error('Error al procesar la respuesta del servidor. Respuesta no válida.');
    }
    
    if (!data.success) throw new Error(data.message || 'Error al cargar artículos');
    
    // Extract items from the response, handling different possible structures
    let items = [];
    if (data.data) {
      if (Array.isArray(data.data)) {
        items = data.data;
      } else if (data.data.data && Array.isArray(data.data.data)) {
        items = data.data.data;
      }
    }
    
    console.log('Items extracted:', items);
    
    // Filter items based on TIPO, CATEGORIA, SEDE and ESTADO
    const filtrados = items.filter(item => {
      // Normalize all fields to prevent undefined errors
      const itemTipo = String(item.TIPO || '').trim().toUpperCase();
      const itemCategoria = String(item.CATEGORIA || '').trim().toUpperCase();
      const itemSede = String(item.SEDE || '').trim().toUpperCase();
      const itemEstado = String(item.ESTADO || '').trim().toUpperCase();
      
      const searchTipo = datosUsuario.tipo.trim().toUpperCase();
      const searchCategoria = datosUsuario.categoria.trim().toUpperCase();
      const searchSede = datosUsuario.sede.trim().toUpperCase();
      
      // We don't need complex sede matching here since the API already filtered by sede
      // Just check if the item is active and matches tipo and categoria
      const estadoMatch = itemEstado === 'ACTIVO';
      
      const match = itemTipo === searchTipo && 
                   itemCategoria === searchCategoria && 
                   estadoMatch;
      
      console.log(`Item: ${item.ITEM || item.NOMBRE}, Tipo: ${itemTipo}, Categoria: ${itemCategoria}, Sede: ${itemSede}, Estado: ${itemEstado}, Match: ${match}`);
      
      return match;
    });
    
    console.log('Items filtrados:', filtrados);
    
    if (filtrados.length === 0) {
      throw new Error(`No se encontraron items para ${datosUsuario.tipo} - ${datosUsuario.categoria} en la sede ${datosUsuario.sede}`);
    }
    
    // Primero, configurar el HTML del formulario
    document.querySelector(".item-box").innerHTML = `
      <div class="form-container">
        <h3 id="itemNombre"></h3>
        <form id="formularioInventario" onsubmit="guardarCantidad(event)">
          <div class="form-group">
            <label for="cantidad">Cantidad:</label>
            <input type="number" id="cantidad" name="cantidad" required min="0">
          </div>
          <div class="form-group">
            <button type="submit" id="btnGuardar" class="btn">Guardar</button>
          </div>
        </form>
        <div class="progress-container" style="display: none;">
          <div id="progressBar" class="progress-bar"></div>
        </div>
      </div>
    `;
    
    // Luego, mostrar los ítems
    const itemNames = filtrados.map(item => item.ITEM || item.NOMBRE || '');
    mostrarItems(itemNames);
    
  } catch (error) {
    console.error("Error:", error);
    const isInventarioExistente = error.message.includes('Ya existe');
    
    document.querySelector(".item-box").innerHTML = `
      <div class='form-group error-message ${isInventarioExistente ? "inventario-existente" : ""}'>
        <div class="error-icon">${isInventarioExistente ? '⚠️' : '❌'}</div>
        <h3>${isInventarioExistente ? 'Inventario Existente' : 'Error'}</h3>
        <p>${error.message}</p>
        <div class="button-group">
          <button onclick="window.location.href='ingreso.html'" class="btn btn-primary">Volver al Inicio</button>
        </div>
      </div>`;
  }
}

// When saving inventory records, use the registros endpoint
function guardarCantidad(event) {
  event.preventDefault();
  const cantidad = document.getElementById("cantidad").value;
  
  if (!listaItems || listaItems.length === 0) {
    alert("No hay ítems para registrar.");
    return;
  }

  document.getElementById("mensajeConfirmacion").innerHTML = `
    ¿Confirmas que deseas registrar <strong>${cantidad}</strong> unidades para el ítem <strong>${listaItems[indexItem]}</strong>?
  `;
  document.getElementById("modalConfirmarCantidad").style.display = "flex";
}

function confirmarGuardarCantidad() {
  const cantidad = document.getElementById("cantidad").value;
  const boton = document.getElementById("btnGuardar");
  const modalBoton = document.querySelector("#modalConfirmarCantidad button");
  
  // Disable both buttons immediately
  boton.disabled = true;
  if (modalBoton) modalBoton.disabled = true;
  
  // Update button text to show processing
  boton.textContent = "Guardando...";
  if (modalBoton) modalBoton.textContent = "Guardando...";

  const registro = {
    fechaBD: new Date().toLocaleDateString(),
    tipo: datosUsuario.tipo,
    categoria: datosUsuario.categoria,
    responsable: datosUsuario.responsable,
    fecha: datosUsuario.fecha,
    item: listaItems[indexItem],
    cantidad: parseInt(cantidad),
    sede: datosUsuario.sede,
    modo: datosUsuario.modo
  };

  // Log the request for debugging
  console.log("Guardando registro:", registro);

  // Use the correct 'registros' endpoint as specified in the error message
  fetch(scriptURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      api: 'registros',
      accion: 'guardar',
      registro: registro
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error de red: ${response.status} ${response.statusText}`);
    }
    return response.text();
  })
  .then(text => {
    console.log('Server response:', text);
    try {
      const data = JSON.parse(text);
      if (!data.success) {
        throw new Error(data.message || 'Error al guardar registro');
      }
      indexItem++;
      cerrarModalCantidad();
      mostrarItem();
    } catch (error) {
      console.error("Error parsing response:", error);
      throw new Error('Error al procesar la respuesta del servidor: ' + text);
    }
  })
  .catch(error => {
    console.error("Error completo:", error);
    alert("Error al guardar. Por favor, intente nuevamente: " + error.message);
    // Re-enable buttons on error
    boton.disabled = false;
    if (modalBoton) modalBoton.disabled = false;
    boton.textContent = "Guardar";
    if (modalBoton) modalBoton.textContent = "Confirmar";
  })
  .finally(() => {
    // Only re-enable and reset buttons if there was an error
    // Successful saves will have moved to the next item already
    if (boton.disabled) {
      boton.disabled = false;
      boton.textContent = "Guardar";
      if (modalBoton) {
        modalBoton.disabled = false;
        modalBoton.textContent = "Confirmar";
      }
    }
    cerrarModalCantidad();
  });
}

function cerrarModalCantidad() {
  document.getElementById("modalConfirmarCantidad").style.display = "none";
}

function confirmarVolver() {
  window.location.replace('ingreso.html');
}

function cerrarModal() {
  document.getElementById("modalConfirmacion").style.display = "none";
}

function mostrarItems(items) {
  if (!items || items.length === 0) {
    document.querySelector(".item-box").innerHTML = "<div class='form-group'><strong>No hay ítems disponibles para esta categoría en esta sede.</strong></div>";
    return;
  }
  
  listaItems = items.map(i => i.ITEM || i.Item || i.NOMBRE || i); // Try different field names
  indexItem = 0;
  mostrarItem();
  actualizarProgreso();
}

function actualizarProgreso() {
  if (listaItems.length > 0) {
    // Show the progress container if it's hidden
    const progressContainer = document.querySelector(".progress-container");
    if (progressContainer) {
      progressContainer.style.display = "block";
    }
    
    const porcentaje = (indexItem / listaItems.length) * 100;
    document.getElementById("progressBar").style.width = porcentaje + "%";
  }
}

function mostrarItem() {
  if (indexItem < listaItems.length) {
    // Verificar que los elementos existan antes de manipularlos
    const itemNombreElement = document.getElementById("itemNombre");
    const cantidadElement = document.getElementById("cantidad");
    
    if (!itemNombreElement || !cantidadElement) {
      console.error("Error: Elementos del formulario no encontrados");
      document.querySelector(".item-box").innerHTML = `
        <div class='form-group error-message'>
          <h3>⚠️ Error</h3>
          <p>Error al mostrar el formulario de inventario. Elementos no encontrados.</p>
          <button onclick="window.location.href='ingreso.html'" class="btn">Volver a selección</button>
        </div>`;
      return;
    }
    
    itemNombreElement.textContent = listaItems[indexItem];
    cantidadElement.value = "";
    setTimeout(() => cantidadElement.focus(), 300);
    actualizarProgreso();
  } else {
    document.querySelector(".item-box").innerHTML = `
      <div class="success-message">
        <h3>Inventario Finalizado</h3>
        <p>Todos los ítems han sido registrados correctamente.</p>
        <p>Registro Completado</p>
      </div>
    `;
    document.getElementById("progressBar").style.width = "100%";
    
    // Add 3-second delay before redirect
    setTimeout(() => {
      window.location.href = 'ingreso.html';
    }, 3000);
  }
}

// Eliminar la función mostrarModal que no se usa
// function mostrarModal() {
//   document.getElementById("modalConfirmacion").style.display = "flex";
// }

function ajustarAltura() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', ajustarAltura);
window.addEventListener('orientationchange', ajustarAltura);
document.addEventListener('DOMContentLoaded', ajustarAltura);
ajustarAltura();

// Eliminar la función cerrarModalError si no hay un modal con ese ID en el HTML
// function cerrarModalError() {
//   document.getElementById("modalError").style.display = "none"; 
// }

// When you need to show the inventario existente message
function mostrarInventarioExistente(mensaje) {
    // Get the sede from datosUsuario
    const sede = datosUsuario.sede || '';
    
    // Determine logo path based on sede
    let logoPath = 'img/logo.png'; // Default logo
    
    if (sede.toUpperCase() === 'FILANDIA') {
        logoPath = 'img/logoMP.png';
    } else if (sede.toUpperCase() === 'SANTA ROSA') {
        logoPath = 'img/logoSR.png';
    }
    
    // Create modal if it doesn't exist
    if (!document.getElementById('modalInventarioExistente')) {
        const modal = document.createElement('div');
        modal.id = 'modalInventarioExistente';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-contenido">
                <img src="${logoPath}" alt="Logo ${sede}" class="modal-logo">
                <span class="error-icon">⚠️</span>
                <h3>Inventario Existente</h3>
                <p>${mensaje}</p>
                <div class="button-group">
                    <button class="btn-primary" onclick="cerrarModalInventarioExistente()">Volver al Inicio</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } else {
        // Update message and logo if modal already exists
        const mensajeElement = document.querySelector('#modalInventarioExistente p');
        const logoElement = document.querySelector('#modalInventarioExistente .modal-logo');
        
        mensajeElement.innerHTML = mensaje; // Use innerHTML to preserve HTML formatting
        if (logoElement) {
            logoElement.src = logoPath;
            logoElement.alt = `Logo ${sede}`;
        }
    }
    
    // Show the modal
    document.getElementById('modalInventarioExistente').style.display = 'flex';
}

// Function to close the modal
function cerrarModalInventarioExistente() {
    document.getElementById('modalInventarioExistente').style.display = 'none';
    // Redirect to ingreso.html when closing the modal
    window.location.href = 'ingreso.html';
}


