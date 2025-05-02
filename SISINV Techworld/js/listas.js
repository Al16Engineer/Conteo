window.listas = {
    sedes: ['SANTA ROSA', 'FILANDIA', 'ALL'],
    tipos: [],
    categorias: [],
    modos: [
        'MENSUAL',
        'DIARIO',
        'SEMANAL'
    ],
    modelos: [
        'UNIDAD',
        'PAQUETE',
        'PACA',
        'KILO'
    ],

    actualizarListasDesdeDatos(data) {
        if (!data || !Array.isArray(data)) return;
        
        // Obtener valores únicos
        const tiposSet = new Set();
        const categoriasSet = new Set();
        
        data.forEach(item => {
            if (item.TIPO) tiposSet.add(item.TIPO);
            if (item.CATEGORIA) categoriasSet.add(item.CATEGORIA);
        });
        
        // Convertir Sets a Arrays y ordenar
        this.tipos = Array.from(tiposSet).sort();
        this.categorias = Array.from(categoriasSet).sort();
    },

    inicializarSelectores(valoresArticulo = {}) {
        const selectores = {
            sede: this.sedes,
            tipo: this.tipos,
            categoria: this.categorias,
            modo: this.modos,
            modelo: this.modelos
        };

        for (const [id, opciones] of Object.entries(selectores)) {
            const select = document.getElementById(id);
            if (!select) continue;

            // Mantener la primera opción (placeholder)
            const primeraOpcion = select.options[0];
            select.innerHTML = '';
            select.appendChild(primeraOpcion);

            // Agregar las opciones
            opciones.forEach(opcion => {
                const option = document.createElement('option');
                option.value = opcion;
                option.textContent = opcion === 'ALL' ? 'AMBAS' : opcion;
                if (valoresArticulo[id] === opcion) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    }
};

// Inicializar los selectores cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.listas.inicializarSelectores();
});