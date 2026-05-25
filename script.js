// ============================================
// PICA PICA DELIVERY - Conexión con la API
// Backend: Juan Escalante
// API: SheetDB + Google Sheets
// ============================================

const API_URL = "https://sheetdb.io/api/v1/k0g0vjejgj9ow";

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

// =============================================
// Cargar Resumen de Pedidos
// =============================================
async function cargarResumenPedidos() {
    const container = document.getElementById('orders-summary-container');
    if (!container) return;

    try {
        const pedidos = await obtenerPedidos();
        const today = new Date().toISOString().slice(0, 10);
        const pedidosHoy = Array.isArray(pedidos) ? pedidos.filter(p => (p.Fecha || '').startsWith(today)) : [];

        if (pedidosHoy.length === 0) {
            container.innerHTML = '<p>No hay pedidos hoy.</p>';
            return;
        }

        container.innerHTML = pedidosHoy.map(p => `
            <div class="card mb-2" style="padding: 10px; border: 1px solid #ddd;">
                <p><strong>${p.Nombre_Cliente}</strong>: ${p.Nombre_Plato}</p>
                <small>Estado: ${p.Estado_Entrega || 'Pendiente'}</small>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error al cargar el resumen:", error);
        container.innerHTML = '<p>Error al cargar el resumen. Intenta recargar la página.</p>';
    }
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
  const res = await fetch(`${API_URL}/Nombre_vecino/${nombreVecino}?sheet=Suscripciones`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Estado_Suscripcion: nuevoEstado } })
  });
  return await res.json();
}

async function actualizarPlanSuscripcion(nombreVecino, nuevoPlan) {
  const res = await fetch(`${API_URL}/Nombre_vecino/${nombreVecino}?sheet=Suscripciones`, {
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
// =============================================
function calcularTiempoEstimado(distanciaKm, vehiculo) {
  const tiempoPorKm = (vehiculo === "Moto") ? 2 : 4;
  const tiempoCocina = 15;
  return Math.ceil((distanciaKm * tiempoPorKm) + tiempoCocina);
}

// =============================================
// HU4: Asignar repartidor a un pedido (PUT)
// =============================================

async function asignarRepartidor(idPedido, idRepartidor, distanciaKM) {
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
// =============================================
async function asignarRepartidorAutomatico(idPedido, distanciaKM) {
  try {
    const disponibles = await obtenerRepartidoresDisponibles();

    if (!disponibles || disponibles.length === 0) {
      alert("⚠️ No hay repartidores disponibles en este momento.");
      return null;
    }

    const elegido = disponibles[0];
    const tiempoEstimado = calcularTiempoEstimado(distanciaKM, elegido.Vehiculo);

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

    await actualizarDisponibilidadRepartidor(elegido.ID_Repartidor, "No Disponible");

    console.log(`✅ ${elegido.Nombre} (${elegido.Vehiculo}) asignado al pedido ${idPedido} - ${tiempoEstimado} min`);

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

async function actualizarEstadoEntrega(idPedido, nuevoEstado) {
  const res = await fetch(`${API_URL}/ID_Pedido/${idPedido}?sheet=Pedidos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Estado_Entrega: nuevoEstado } })
  });
  return await res.json();
}

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

// =============================================
// HU11: Calificaciones de Almuerzos
// Hoja: "Calificaciones"
// Columnas: ID_Calificacion, Nombre_Cliente, Nombre_Plato, Calificacion, Comentario, Fecha
// =============================================

// Obtener todas las calificaciones
async function obtenerCalificaciones() {
  const res = await fetch(`${API_URL}?sheet=Calificaciones`);
  return await res.json();
}

// Obtener calificaciones de un plato específico
async function obtenerCalificacionesPorPlato(nombrePlato) {
  const res = await fetch(`${API_URL}/search?Nombre_Plato=${encodeURIComponent(nombrePlato)}&sheet=Calificaciones`);
  return await res.json();
}

// Registrar nueva calificación (1 a 5 estrellas + comentario)
async function registrarCalificacion(nombreCliente, nombrePlato, calificacion, comentario) {
  if (calificacion < 1 || calificacion > 5) {
    alert("La calificación debe ser entre 1 y 5.");
    return null;
  }

  const nuevaCalificacion = {
    ID_Calificacion: "CAL" + Date.now().toString().slice(-6),
    Nombre_Cliente: nombreCliente,
    Nombre_Plato: nombrePlato,
    Calificacion: calificacion,
    Comentario: comentario || "",
    Fecha: new Date().toISOString().slice(0, 10)
  };

  const res = await fetch(`${API_URL}?sheet=Calificaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [nuevaCalificacion] })
  });

  console.log(`⭐ Calificación registrada: ${nombrePlato} - ${calificacion}/5`);
  return await res.json();
}

// Calcular promedio de calificación de un plato
async function obtenerPromedioPlato(nombrePlato) {
  try {
    const calificaciones = await obtenerCalificacionesPorPlato(nombrePlato);
    if (!calificaciones || calificaciones.length === 0) return 0;

    const suma = calificaciones.reduce((acc, c) => acc + parseInt(c.Calificacion), 0);
    return (suma / calificaciones.length).toFixed(1);
  } catch (error) {
    console.error("Error al obtener promedio:", error);
    return 0;
  }
}

// =============================================
// HU15: Generar Factura Digital (jsPDF)
// Requiere: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
// =============================================

function generarFacturaDigital(pedido) {
  // Verificar que jsPDF esté cargado
  if (typeof window.jspdf === 'undefined') {
    alert("Error: jsPDF no está cargado. Agregá el script en el HTML.");
    return null;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // --- Encabezado ---
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PICA PICA DELIVERY", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Comida casera de tu barrio", 105, 28, { align: "center" });

  // Línea separadora
  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(1);
  doc.line(20, 33, 190, 33);

  // --- Info de Factura ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA DIGITAL", 105, 45, { align: "center" });

  const fechaActual = new Date().toLocaleDateString("es-BO");
  const horaActual = new Date().toLocaleTimeString("es-BO", { hour: '2-digit', minute: '2-digit' });
  const numFactura = "FAC-" + Date.now().toString().slice(-8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`N° Factura: ${numFactura}`, 20, 55);
  doc.text(`Fecha: ${fechaActual}`, 20, 62);
  doc.text(`Hora: ${horaActual}`, 20, 69);

  // --- Datos del Cliente ---
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 75, 190, 75);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Cliente", 20, 85);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${pedido.Nombre_Cliente || "N/A"}`, 20, 93);
  doc.text(`ID Pedido: ${pedido.ID_Pedido || "N/A"}`, 20, 100);

  // --- Detalle del Pedido ---
  doc.line(20, 106, 190, 106);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle del Pedido", 20, 116);

  // Tabla simple
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Plato", 20, 126);
  doc.text("Cantidad", 110, 126);
  doc.text("Precio", 160, 126);

  doc.line(20, 129, 190, 129);

  doc.setFont("helvetica", "normal");
  doc.text(pedido.Nombre_Plato || "N/A", 20, 137);
  doc.text("1", 110, 137);
  doc.text(`Bs ${pedido.Precio || 0}`, 160, 137);

  doc.line(20, 142, 190, 142);

  // --- Total ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: Bs ${pedido.Precio || 0}`, 160, 155, { align: "right" });

  // --- Info de Entrega ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Estado de entrega: ${pedido.Estado_Entrega || "Pendiente"}`, 20, 170);
  doc.text(`Distancia: ${pedido.Distancia_KM || "N/A"} km`, 20, 177);
  doc.text(`Tiempo estimado: ${pedido.Tiempo_Estimado_Min || "N/A"} min`, 20, 184);

  // --- Pie de página ---
  doc.setDrawColor(46, 125, 50);
  doc.line(20, 260, 190, 260);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Pica Pica Delivery - Comida casera ultra local", 105, 268, { align: "center" });
  doc.text("Santa Cruz, Bolivia | picapicadelivery@gmail.com", 105, 274, { align: "center" });
  doc.text("Este documento es una factura digital generada automáticamente.", 105, 280, { align: "center" });

  // --- Descargar PDF ---
  const nombreArchivo = `Factura_${pedido.Nombre_Cliente || "cliente"}_${pedido.ID_Pedido || "pedido"}.pdf`;
  doc.save(nombreArchivo);

  console.log(`📄 Factura generada: ${nombreArchivo}`);
  return doc;
}

// Generar factura desde un ID de pedido (busca en SheetDB)
async function generarFacturaPorID(idPedido) {
  try {
    const pedidos = await obtenerPedidos();
    const pedido = pedidos.find(p => String(p.ID_Pedido) === String(idPedido));

    if (!pedido) {
      alert("No se encontró el pedido con ese ID.");
      return;
    }

    generarFacturaDigital(pedido);
    alert(`✅ Factura generada para el pedido ${idPedido}`);
  } catch (error) {
    console.error("Error al generar factura:", error);
    alert("Error al generar la factura.");
  }
}

// =============================================
// HU15: Enviar Factura por Email (EmailJS)
// Requiere: <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
// Configurar: emailjs.init("TU_PUBLIC_KEY") en el HTML
// =============================================

async function enviarEmailFactura(emailDestino, pedido) {
  try {
    // Verificar que EmailJS esté cargado
    if (typeof emailjs === 'undefined') {
      console.warn("EmailJS no está configurado. La factura se descargó pero no se envió por correo.");
      return null;
    }

    const parametros = {
      to_email: emailDestino,
      to_name: pedido.Nombre_Cliente || "Cliente",
      pedido_id: pedido.ID_Pedido || "N/A",
      plato: pedido.Nombre_Plato || "N/A",
      precio: pedido.Precio || "0",
      fecha: pedido.Fecha || new Date().toISOString().slice(0, 10),
      estado: pedido.Estado_Entrega || "Pendiente"
    };

    // service_id y template_id se configuran en emailjs.com
    const resultado = await emailjs.send("service_picapica", "template_factura", parametros);

    console.log(`📧 Email enviado a ${emailDestino}`);
    alert(`✅ Factura enviada a ${emailDestino}`);
    return resultado;
  } catch (error) {
    console.error("Error al enviar email:", error);
    alert("❌ No se pudo enviar el email. La factura se descargó localmente.");
    return null;
  }
}

// Función completa: genera PDF + envía por email
async function facturarYEnviar(idPedido, emailDestino) {
  try {
    const pedidos = await obtenerPedidos();
    const pedido = pedidos.find(p => String(p.ID_Pedido) === String(idPedido));

    if (!pedido) {
      alert("No se encontró el pedido.");
      return;
    }

    // 1. Generar PDF (se descarga automáticamente)
    generarFacturaDigital(pedido);

    // 2. Enviar notificación por email
    if (emailDestino) {
      await enviarEmailFactura(emailDestino, pedido);
    }

    console.log(`✅ Pedido ${idPedido} facturado y enviado.`);
  } catch (error) {
    console.error("Error en facturación:", error);
  }
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
// // HU4 - Asignar repartidor AUTOMÁTICO:
// const info = await asignarRepartidorAutomatico("P123456", 2.5);
//
// // HU6 - Calcular tiempo:
// calcularTiempoEstimado(2.5);          // → 25 min (bici)
// calcularTiempoEstimado(2.5, "Moto");  // → 20 min (moto)
//
// // HU11 - Calificar un almuerzo:
// registrarCalificacion("Juan", "Majadito", 5, "Excelente sabor");
//
// // HU11 - Ver promedio de un plato:
// const promedio = await obtenerPromedioPlato("Majadito"); // → "4.5"
//
// // HU15 - Generar factura PDF:
// generarFacturaPorID("P123456");
//
// // HU15 - Generar factura + enviar por email:
// facturarYEnviar("P123456", "cliente@gmail.com");
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

    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    const distanciaAleatoria = (Math.random() * 5 + 1).toFixed(1);
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
        
        if(typeof cargarResumenPedidos === 'function') cargarResumenPedidos();
        if(typeof renderTracking === 'function') renderTracking();
        
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

// ============================================
// SISTEMA DE NOTIFICACIONES (POLLING)
// ============================================

function dispararNotificacion(titulo, texto) {
    const banner = document.querySelector('.notification-banner');
    const bannerTitle = document.querySelector('.notification-banner__title');
    const bannerText = document.querySelector('.notification-banner__text');

    if (banner && bannerTitle && bannerText) {
        bannerTitle.textContent = titulo;
        bannerText.textContent = texto;
        banner.classList.add('show');
        setTimeout(() => {
            banner.classList.remove('show');
        }, 5000);
    }
}

let totalPedidosConocidos = -1;

async function revisarNuevosPedidosAutomatizado() {
    try {
        const pedidos = await obtenerPedidos();
        const pedidosDiarios = Array.isArray(pedidos) ? pedidos : [];
        
        const today = new Date().toISOString().slice(0, 10);
        const pedidosHoy = pedidosDiarios.filter(pedido => (pedido.Fecha || '').startsWith(today));

        if (totalPedidosConocidos === -1) {
            totalPedidosConocidos = pedidosHoy.length;
            return;
        }

        if (pedidosHoy.length > totalPedidosConocidos) {
            const nuevoPedido = pedidosHoy[pedidosHoy.length - 1];
            
            dispararNotificacion(
                `🔔 ¡Nuevo Pedido Recibido!`,
                `${nuevoPedido.Nombre_Cliente || 'Un vecino'} solicitó: ${nuevoPedido.Nombre_Plato || 'Almuerzo'}`
            );

            if (typeof cargarResumenPedidos === 'function') {
                cargarResumenPedidos();
            }
        }

        totalPedidosConocidos = pedidosHoy.length;

    } catch (error) {
        console.error("Error en el monitoreo en segundo plano:", error);
    }
}

// ============================================
// FUNCIONES DE APOYO (REQUERIDAS POR EL HTML)
// ============================================

function formatearDuracion(minutos) {
    if (!minutos || isNaN(minutos)) return "0 min";
    const m = Math.round(minutos);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

function formatHora(hora) {
    if (!hora || hora === "Sin hora") return "Pendiente";
    return hora;
}

function calcularTiempoEntrega(distancia) {
    return distancia ? Math.ceil((distancia * 4) + 15) : 30;
}

function obtenerHoraEstimacion(minutos) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutos);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function reportarRetraso(idPedido) {
    if(!confirm("¿Confirmar reporte de retraso para el pedido " + idPedido + "?")) return;
    await actualizarEstadoEntrega(idPedido, "Retrasado");
    alert("Reportado como retrasado.");
    if(typeof cargarResumenPedidos === 'function') cargarResumenPedidos();
}

function agruparPorHora(pedidos) {
    return pedidos.reduce((grupos, pedido) => {
        const hora = pedido.Hora_Creacion || 'Sin hora';
        if (!grupos[hora]) grupos[hora] = [];
        grupos[hora].push(pedido);
        return grupos;
    }, {});
}

// Polling cada 100 segundos
setInterval(revisarNuevosPedidosAutomatizado, 100000);
