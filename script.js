const safeCall = (funcName, ...args) => {
    if (typeof window[funcName] === 'function') {
        window[funcName](...args);
    }
};
// ============================================
// PICA PICA DELIVERY - Conexión con la API
// Backend: Juan Escalante
// API: SheetDB + Google Sheets
// ============================================

const API_URL = "https://sheetdb.io/api/v1/iqzxj7h81qhi5";

// =====================
// MENÚ
// =====================
window.usuarioLogueado = null;
window.suscripcionActual = null;
window.menuData = [];

// 1. Función para verificar si el usuario es suscriptor
async function verificarYActivarModo() {
    const nombreInput = document.getElementById('check-user-name').value.trim();
    const msg = document.getElementById('sub-status-msg');

    if (!nombreInput) return;

    msg.textContent = "Verificando...";

    try {
        const suscripciones = await obtenerSuscripciones();
        const esSuscriptor = suscripciones.find(s => 
            s.Nombre_vecino.toLowerCase() === nombreInput.toLowerCase()
        );

        if (esSuscriptor) {
            if (esSuscriptor.Estado_Suscripcion === "Pausado") {
                window.usuarioLogueado = null;
                msg.textContent = "⏸️ Tu suscripción está pausada. Contacta soporte para reactivarla.";
                msg.style.color = "#e67e22";
                renderMenu(window.menuData);
                return;
            }

            window.usuarioLogueado = esSuscriptor.Nombre_vecino;
            window.suscripcionActual = esSuscriptor;
            msg.textContent = `✅ Plan Semanal Activo. ¡Hola ${window.usuarioLogueado}! Tus platos hoy son gratis.`;
            msg.style.color = "var(--color-primary-dark)";
            renderMenu(window.menuData);
            renderCuenta();
            renderTracking();
        } else {
            window.usuarioLogueado = null;
            msg.textContent = "❌ No tienes una suscripción activa con ese nombre.";
            msg.style.color = "#d64541";
            renderMenu(window.menuData);
        }
    } catch (error) {
        msg.textContent = "Error al verificar. Intenta de nuevo.";
    }
}

// Obtener todos los platos del menú
async function obtenerMenu() {
  const res = await fetch(`${API_URL}?sheet=Menú`);
  const data = await res.json();
  return data;
}

// Buscar platos por categoría
async function buscarPorCategoria(categoria) {
  const res = await fetch(`${API_URL}/search?Categoria=${categoria}&sheet=Menú`);
  const data = await res.json();
  return data;
}

// Agregar un plato al menú
async function agregarPlato(plato) {
  const res = await fetch(`${API_URL}?sheet=Menú`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [plato] })
  });
  return await res.json();
}

// Actualizar un plato por ID
async function actualizarPlato(id, cambios) {
  const res = await fetch(`${API_URL}/ID/${id}?sheet=Menú`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: cambios })
  });
  return await res.json();
}

// Eliminar un plato por ID
async function eliminarPlato(id) {
  const res = await fetch(`${API_URL}/ID/${id}?sheet=Menú`, {
    method: "DELETE"
  });
  return await res.json();
}

// =====================
// PEDIDOS
// =====================

// Obtener todos los pedidos
async function obtenerPedidos() {
  const res = await fetch(`${API_URL}?sheet=Pedidos`);
  const data = await res.json();
  return data;
}

// Crear un nuevo pedido
async function crearPedido(pedido) {
  const res = await fetch(`${API_URL}?sheet=Pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [pedido] })
  });
  return await res.json();
}

// Actualizar estado de un pedido
async function actualizarEstadoPedido(idPedido, nuevoEstado) {
  const res = await fetch(`${API_URL}/ID_Pedido/${idPedido}?sheet=Pedidos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Estado: nuevoEstado } })
  });
  return await res.json();
}

// =====================
// SUSCRIPCIONES
// =====================

// Obtener todas las suscripciones
async function obtenerSuscripciones() {
  const res = await fetch(`${API_URL}?sheet=Suscripciones`);
  const data = await res.json();
  return data;
}

// Registrar nueva suscripción (incluye Estado y Plan_ID)
async function registrarSuscripcion(sub) {
  const res = await fetch(`${API_URL}?sheet=Suscripciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{
      ...sub,
      Estado_Suscripcion: "Activo",
      Plan_ID: "P01"
    }] })
  });
  return await res.json();
}

// =============================================
// HU2: Pausar / Reanudar suscripción (PUT)
// =============================================

async function actualizarEstadoSuscripcion(nombreVecino, nuevoEstado) {
  const nombreCodificado = encodeURIComponent(nombreVecino);
  const res = await fetch(`${API_URL}/Nombre_vecino/${nombreCodificado}?sheet=Suscripciones`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Estado_Suscripcion: nuevoEstado } })
  });
  return await res.json();
}

async function actualizarPlanSuscripcion(nombreVecino, nuevoPlan) {
  const nombreCodificado = encodeURIComponent(nombreVecino);
  const res = await fetch(`${API_URL}/Nombre_vecino/${nombreCodificado}?sheet=Suscripciones`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Plan: nuevoPlan } })
  });
  return await res.json();
}

async function toggleSuscripcion(nombreVecino) {
  try {
    const suscripciones = await obtenerSuscripciones();
    const usuario = suscripciones.find(s =>
      s.Nombre_vecino.toLowerCase() === nombreVecino.toLowerCase()
    );

    if (!usuario) {
      alert("No se encontró la suscripción.");
      return;
    }

    const estadoActual = usuario.Estado_Suscripcion || "Activo";
    const nuevoEstado = estadoActual === "Activo" ? "Pausado" : "Activo";

    await actualizarEstadoSuscripcion(usuario.Nombre_vecino, nuevoEstado);
    alert(`Suscripción ${nuevoEstado === "Activo" ? "reactivada ✅" : "pausada ⏸️"}`);
    return nuevoEstado;
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    alert("Error al actualizar la suscripción.");
  }
}

// =============================================
// HU6: Cálculo de Tiempo Estimado de Entrega
// Fórmula: (distancia × min/km según vehículo) + cocina
// Misael solo llama: calcularTiempoEstimado(2.5)
// =============================================
function calcularTiempoEstimado(distanciaKm, vehiculo) {
  // Bici: ~15 km/h → 4 min/km | Moto: ~30 km/h → 2 min/km
  const tiempoPorKm = (vehiculo === "Moto") ? 2 : 4;
  const tiempoCocina = 15; // 15 minutos de preparación
  return Math.ceil((distanciaKm * tiempoPorKm) + tiempoCocina);
}

// =============================================
// HU4: Asignar repartidor a un pedido (PUT)
// =============================================

// Asignación manual (el admin elige el repartidor)
async function asignarRepartidor(idPedido, idRepartidor, distanciaKM) {
  // Buscar vehículo del repartidor para calcular tiempo
  let vehiculo = "Bici";
  try {
    const repartidores = await obtenerRepartidores();
    const rep = repartidores.find(r => r.ID_Repartidor === idRepartidor);
    if (rep) vehiculo = rep.Vehiculo;
  } catch (e) {
    console.warn("No se pudo verificar vehículo, usando Bici por defecto.");
  }

  const tiempoEstimado = calcularTiempoEstimado(distanciaKM, vehiculo);

  const res = await fetch(`${API_URL}/ID_Pedido/${idPedido}?sheet=Pedidos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        ID_Repartidor: idRepartidor,
        Distancia_KM: distanciaKM,
        Tiempo_Estimado_Min: tiempoEstimado,
        Estado_Entrega: "En Camino"
      }
    })
  });
  return await res.json();
}

// =============================================
// HU4: Simulador de Cercanía (asignación automática)
// Busca el primer repartidor Disponible y lo asigna.
// El frontend solo llama: asignarRepartidorAutomatico(idPedido, distanciaKM)
// =============================================
async function asignarRepartidorAutomatico(idPedido, distanciaKM) {
  try {
    // 1. Buscar repartidores disponibles
    const disponibles = await obtenerRepartidoresDisponibles();

    if (!disponibles || disponibles.length === 0) {
      alert("⚠️ No hay repartidores disponibles en este momento.");
      return null;
    }

    // 2. Seleccionar el primer repartidor disponible
    //    (simula cercanía: el más cercano es el primero de la lista)
    const elegido = disponibles[0];

    // 3. Calcular tiempo estimado según su vehículo
    const tiempoEstimado = calcularTiempoEstimado(distanciaKM, elegido.Vehiculo);

    // 4. Actualizar el pedido en la hoja Pedidos
    await fetch(`${API_URL}/ID_Pedido/${idPedido}?sheet=Pedidos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          ID_Repartidor: elegido.ID_Repartidor,
          Distancia_KM: distanciaKM,
          Tiempo_Estimado_Min: tiempoEstimado,
          Estado_Entrega: "En Camino"
        }
      })
    });

    // 5. Marcar repartidor como ocupado
    await actualizarDisponibilidadRepartidor(elegido.ID_Repartidor, "No Disponible");

    console.log(`✅ ${elegido.Nombre} (${elegido.Vehiculo}) asignado al pedido ${idPedido} - ${tiempoEstimado} min`);

    // 6. Retornar info para que el frontend la muestre
    return {
      repartidor: elegido.Nombre,
      vehiculo: elegido.Vehiculo,
      tiempoEstimado: tiempoEstimado
    };
  } catch (error) {
    console.error("Error en asignación automática:", error);
    alert("Error al asignar repartidor.");
    return null;
  }
}

// Actualizar solo el estado de entrega
async function actualizarEstadoEntrega(idPedido, nuevoEstado) {
  const res = await fetch(`${API_URL}/ID_Pedido/${idPedido}?sheet=Pedidos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Estado_Entrega: nuevoEstado } })
  });
  return await res.json();
}

// Completar entrega y liberar repartidor
async function completarEntrega(idPedido, idRepartidor) {
  await actualizarEstadoEntrega(idPedido, "Entregado");
  await actualizarDisponibilidadRepartidor(idRepartidor, "Disponible");
  console.log(`✅ Pedido ${idPedido} entregado. ${idRepartidor} disponible de nuevo.`);
}

// =====================
// REPARTIDORES
// =====================

async function obtenerRepartidores() {
  const res = await fetch(`${API_URL}?sheet=Repartidores`);
  return await res.json();
}

async function obtenerRepartidoresDisponibles() {
  const res = await fetch(`${API_URL}/search?Estado_Disponibilidad=Disponible&sheet=Repartidores`);
  return await res.json();
}

async function actualizarDisponibilidadRepartidor(idRepartidor, nuevoEstado) {
  const res = await fetch(`${API_URL}/ID_Repartidor/${idRepartidor}?sheet=Repartidores`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Estado_Disponibilidad: nuevoEstado } })
  });
  return await res.json();
}


// =====================
// EJEMPLO DE USO - GUÍA PARA EL FRONTEND
// =====================
//
// // HU2 - Pausar suscripción:
// actualizarEstadoSuscripcion("Virgilio", "Pausado");
//
// // HU2 - Alternar estado:
// toggleSuscripcion("Virgilio");
//
// // HU4 - Asignar repartidor AUTOMÁTICO (distancia 2.5 km):
// const info = await asignarRepartidorAutomatico("1778377164161", 2.5);
// // info = { repartidor: "Luis Mamani", vehiculo: "Bici", tiempoEstimado: 25 }
//
// // HU4 - Asignar MANUAL:
// asignarRepartidor("1778377164161", "R001", 2.5);
//
// // HU6 - Calcular tiempo (para mostrar en pantalla):
// calcularTiempoEstimado(1.2);          // → 20 min (bici, default)
// calcularTiempoEstimado(1.2, "Moto");  // → 18 min (moto)
// calcularTiempoEstimado(3.0);          // → 27 min (bici)
//
// // Completar entrega y liberar repartidor:
// completarEntrega("1778377164161", "R001");
//


// =====================
// INTERFAZ - MENÚ Y TARJETAS
// =====================

const menuContainer = document.getElementById('menu-container');
const categoryButtonsContainer = document.getElementById('category-buttons');
const subscriptionForm = document.getElementById('subscription-form');
const subscriptionNameInput = document.getElementById('subscription-name');
const subscriptionFeedback = document.getElementById('subscription-feedback');

function crearTarjetaPlato(plato) {
  const linkImagen = plato.Imagen_Url; 
  console.log("Cargando imagen para:", plato.Nombre, "URL:", linkImagen);

  const imageUrl = (linkImagen && linkImagen.trim() !== "")
    ? linkImagen
    : 'https://via.placeholder.com/480x280?text=Sin+Imagen';

  return `
    <article class="card">
      <img class="card__image" 
           src="${imageUrl}" 
           alt="${plato.Nombre}" 
           style="width:100%; height:160px; object-fit:cover;"
           onerror="this.src='https://via.placeholder.com/480x280?text=Error+al+cargar'">
      <div class="card__body">
        <h3 class="card__name">${plato.Nombre}</h3>
        <p class="text-muted">${plato.Categoria || 'General'}</p>
        <div class="card__footer">
          <span class="card__price">Bs ${window.usuarioLogueado ? "0" : (plato.Precio || '0')}</span>
          <button class="btn-add" onclick="procesarPedidoRapido('${plato.Nombre}', ${plato.Precio}, '${plato.ID || ''}')">
            ${window.usuarioLogueado ? "Gratis" : "+"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderMenu(platos) {
  if (!menuContainer) return;
  if (!platos || platos.length === 0) {
    menuContainer.innerHTML = '<p class="text-muted">No hay platos disponibles en este momento.</p>';
    return;
  }
  menuContainer.innerHTML = platos.map(crearTarjetaPlato).join('');
}

function renderCategoryButtons(platos) {
  if (!categoryButtonsContainer) return;

  const categorias = Array.from(new Set(platos.map(plato => plato.Categoria || 'Sin categoría')));
  const botones = ['Todos', ...categorias];

  categoryButtonsContainer.innerHTML = botones.map(nombre => {
    const clase = nombre === 'Todos' ? 'btn-primary' : 'btn-outline';
    return `<button type="button" class="${clase}" data-categoria="${nombre}">${nombre}</button>`;
  }).join('');

  categoryButtonsContainer.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      categoryButtonsContainer.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
      });

      button.classList.remove('btn-outline');
      button.classList.add('btn-primary');

      const categoria = button.dataset.categoria;
      if (categoria === 'Todos') {
        renderMenu(window.menuData);
      } else {
        const filtrados = window.menuData.filter(plato => (plato.Categoria || '').toLowerCase() === categoria.toLowerCase());
        renderMenu(filtrados);
      }
    });
  });
}

function mostrarFeedback(mensaje, esError = false) {
  if (!subscriptionFeedback) return;
  subscriptionFeedback.textContent = mensaje;
  subscriptionFeedback.style.color = esError ? '#d64541' : 'var(--color-text-body)';
}

// Función mejorada para procesar pedidos desde el menú
async function procesarPedidoRapido(nombrePlato, precioOriginal, idPlato = '') {
    let nombreCliente = window.usuarioLogueado;
    let precioFinal = window.usuarioLogueado ? 0 : precioOriginal;

    if (!window.usuarioLogueado) {
        nombreCliente = prompt("Ingresa tu nombre para el pedido:");
        if (!nombreCliente) return;
    }

    // Obtener hora actual
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    // Generar distancia aleatoria (entre 1-6 km)
    const distanciaAleatoria = (Math.random() * 5 + 1).toFixed(1);

    // Calcular tiempo estimado
    const tiempoEstimado = calcularTiempoEstimado(parseFloat(distanciaAleatoria));

    const nuevoPedido = {
        ID_Pedido: "P" + Date.now().toString().slice(-6),
        Nombre_Cliente: nombreCliente,
        Nombre_Plato: nombrePlato,
        Hora_Entrega: "Por confirmar",
        Fecha: new Date().toISOString().slice(0, 10),
        Estado: "Pendiente",
        Precio: precioFinal,
        ID_Repartidor: "",
        Distancia_KM: distanciaAleatoria,
        Tiempo_Estimado_Min: tiempoEstimado,
        Estado_Entrega: "Pendiente",
        Hora_Creacion: horaActual
    };

    try {
        console.log("📦 Procesando pedido:", nuevoPedido);
        await crearPedido(nuevoPedido);
        alert(`✅ ¡Pedido realizado!\n${nombrePlato}\nPrecio: Bs ${precioFinal}\nTiempo estimado: ${tiempoEstimado} min`);
        
        // Actualizar interfaz
        if(typeof cargarResumenPedidos === 'function') cargarResumenPedidos();
        if(typeof renderTracking === 'function') renderTracking();
        
        // Disparar notificación
        if(typeof dispararNotificacion === 'function') {
            dispararNotificacion(
                "🎉 ¡Pedido Confirmado!",
                `${nombreCliente} ordenó: ${nombrePlato}`
            );
        }
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        alert("❌ Hubo un error al procesar el pedido. Intenta de nuevo.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnCheck = document.getElementById('btn-check-sub');
    if (btnCheck) {
        btnCheck.addEventListener('click', verificarYActivarModo);
    }
});

async function iniciarPagina() {
  try {
    const platos = await obtenerMenu();
    window.menuData = Array.isArray(platos) ? platos : [];
    console.log("📋 Menú cargado:", window.menuData);
    renderCategoryButtons(window.menuData);
    renderMenu(window.menuData);
  } catch (error) {
    console.error('Error cargando el menú:', error);
    if (menuContainer) {
      menuContainer.innerHTML = '<p class="text-muted">No se pudo cargar el menú. Intenta recargar la página.</p>';
    }
  }
}

if (subscriptionForm) {
  subscriptionForm.addEventListener('submit', async event => {
    event.preventDefault();
    const nombre = subscriptionNameInput?.value.trim();

    if (!nombre) {
      mostrarFeedback('Por favor ingresa tu nombre.', true);
      return;
    }

    mostrarFeedback('Registrando tu suscripción...');

    try {
      await registrarSuscripcion({
        Nombre_vecino: nombre,
        Plan: 'Semanal',
        Fecha: new Date().toISOString().slice(0, 10)
      });

      mostrarFeedback(`¡Gracias ${nombre}! Tu plan semanal fue confirmado.`);
      subscriptionForm.reset();
    } catch (error) {
      console.error('Error registrando suscripción:', error);
      mostrarFeedback('No se pudo registrar la suscripción. Intenta nuevamente.', true);
    }
  });
}

window.addEventListener('DOMContentLoaded', iniciarPagina);

// ============================================
// LÓGICA PARA AÑADIR PLATOS (ADMIN)
// ============================================

const addDishForm = document.getElementById('add-dish-form');
const dishFeedback = document.getElementById('add-dish-feedback');

if (addDishForm) {
    addDishForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevoPlato = {
            ID: Date.now(),
            Nombre: document.getElementById('dish-name').value.trim(),
            Categoria: document.getElementById('dish-category').value.trim(),
            Precio: document.getElementById('dish-price').value,
            Imagen_Url: document.getElementById('dish-img-url').value.trim(),
            Descripcion: document.getElementById('dish-desc').value.trim()
        };

        dishFeedback.textContent = "Subiendo plato al menú...";
        dishFeedback.style.color = "var(--color-primary)";

        try {
            const resultado = await agregarPlato(nuevoPlato);

            if (resultado) {
                dishFeedback.textContent = "✅ ¡Plato añadido con éxito!";
                dishFeedback.style.color = "var(--color-primary-dark)";
                addDishForm.reset();
                if (typeof iniciarPagina === 'function') iniciarPagina();
            }
        } catch (error) {
            console.error("Error al añadir plato:", error);
            dishFeedback.textContent = "❌ Error al conectar con la base de datos.";
            dishFeedback.style.color = "#d64541";
        }
    });
}

/*notificacion*/

// ============================================
// SISTEMA DE NOTIFICACIONES EN TIEMPO REAL (POLLING)
// ============================================

// 1. Función global para activar visualmente el banner
function dispararNotificacion(titulo, texto) {
    const banner = document.querySelector('.notification-banner');
    const bannerTitle = document.querySelector('.notification-banner__title');
    const bannerText = document.querySelector('.notification-banner__text');

    if (banner && bannerTitle && bannerText) {
        // Inyectamos los datos reales detectados en la API
        bannerTitle.textContent = titulo;
        bannerText.textContent = texto;

        // Mostramos el banner agregando la clase de CSS
        banner.classList.add('show');

        // Lo ocultamos automáticamente tras 5 segundos
        setTimeout(() => {
            banner.classList.remove('show');
        }, 5000);
    }
}

// 2. Guardamos el estado de los pedidos para comparar cambios
let totalPedidosConocidos = -1;

// 3. Función de fondo que consulta a SheetDB automáticamente
async function revisarNuevosPedidosAutomatizado() {
    try {
        // Reutilizamos tu función para obtener los pedidos de la API
        const pedidos = await obtenerPedidos();
        const pedidosDiarios = Array.isArray(pedidos) ? pedidos : [];
        
        // Filtramos solo los pedidos creados el día de hoy
        const today = new Date().toISOString().slice(0, 10);
        const pedidosHoy = pedidosDiarios.filter(pedido => (pedido.Fecha || '').startsWith(today));

        // Si es la primera vez que carga la página, inicializamos el contador sin lanzar alertas
        if (totalPedidosConocidos === -1) {
            totalPedidosConocidos = pedidosHoy.length;
            return;
        }

        // 🔥 ¡DETECCIÓN DE NUEVO PEDIDO!
        // Si hay más pedidos en la API de los que teníamos registrados...
        if (pedidosHoy.length > totalPedidosConocidos) {
            // Obtenemos el último pedido que ingresó a la lista
            const nuevoPedido = pedidosHoy[pedidosHoy.length - 1];
            
            // Disparamos la alerta en pantalla con sus datos reales
            dispararNotificacion(
                `🔔 ¡Nuevo Pedido Recibido!`,
                `${nuevoPedido.Nombre_Cliente || 'Un vecino'} solicitó: ${nuevoPedido.Nombre_Plato || 'Almuerzo'}`
            );

            // Si la función de renderizado de la interfaz existe en la página actual, la actualizamos en vivo
            if (typeof cargarResumenPedidos === 'function') {
                cargarResumenPedidos();
            }
        }

        // Sincronizamos el contador con el estado actual de la base de datos
        totalPedidosConocidos = pedidosHoy.length;

    } catch (error) {
        console.error("Error en el monitoreo en segundo plano:", error);
    }
}

// 4. Configurar el "reloj" (Revisa la API automáticamente cada 10 segundos)
setInterval(revisarNuevosPedidosAutomatizado, 10000);
// --- LÓGICA DE GESTIÓN DINÁMICA (Sprint 2) ---

// HU2: Pausar/Reanudar Suscripción
async function actualizarEstadoSuscripcion(nombre, nuevoEstado) {
    // Primero buscamos el ID del registro para poder actualizarlo
    const subs = await obtenerSuscripciones();
    const sub = subs.find(s => s.Nombre_vecino.toLowerCase() === nombre.toLowerCase());
    
    if (!sub) return alert("Suscripción no encontrada");

    return await fetch(`${API_URL}/Nombre_vecino/${sub.Nombre_vecino}?sheet=Suscripciones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { Estado_Suscripcion: nuevoEstado } })
    });
}

// HU3: Cambiar Plan de Suscripción
async function actualizarPlanSuscripcion(nombre, nuevoPlan) {
    const subs = await obtenerSuscripciones();
    const sub = subs.find(s => s.Nombre_vecino.toLowerCase() === nombre.toLowerCase());
    
    return await fetch(`${API_URL}/Nombre_vecino/${sub.Nombre_vecino}?sheet=Suscripciones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { Plan: nuevoPlan } })
    });
}

// HU4: Asignar Pedido a Repartidor
async function asignarRepartidor(idPedido, idRepartidor) {
    return await fetch(`${API_URL}/ID_Pedido/${idPedido}?sheet=Pedidos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { ID_Repartidor: idRepartidor, Estado_Entrega: "En Camino" } })
    });
}
