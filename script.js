// ============================================
// PICA PICA DELIVERY - Conexion con la API
// Backend: Juan Escalante
// API: SheetDB + Google Sheets
// ============================================

const API_URL = "https://sheetdb.io/api/v1/k0g0vjejgj9ow";

// =====================
// MENU
// =====================
window.usuarioLogueado = null;
window.suscripcionActual = null;
window.menuData = [];

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
                msg.textContent = "Tu suscripcion esta pausada. Contacta soporte para reactivarla.";
                msg.style.color = "#e67e22";
                renderMenu(window.menuData);
                return;
            }

            window.usuarioLogueado = esSuscriptor.Nombre_vecino;
            window.suscripcionActual = esSuscriptor;
            msg.textContent = "Plan Semanal Activo. Hola " + window.usuarioLogueado + "! Tus platos hoy son gratis.";
            msg.style.color = "var(--color-primary-dark)";
            renderMenu(window.menuData);
            renderCuenta();
            renderTracking();
        } else {
            window.usuarioLogueado = null;
            msg.textContent = "No tienes una suscripcion activa con ese nombre.";
            msg.style.color = "#d64541";
            renderMenu(window.menuData);
        }
    } catch (error) {
        msg.textContent = "Error al verificar. Intenta de nuevo.";
    }
}

async function obtenerMenu() {
  const res = await fetch(`${API_URL}?sheet=Menú`);
  const data = await res.json();
  return data;
}

async function buscarPorCategoria(categoria) {
  const res = await fetch(`${API_URL}/search?Categoria=${categoria}&sheet=Menú`);
  const data = await res.json();
  return data;
}

async function agregarPlato(plato) {
  const res = await fetch(`${API_URL}?sheet=Menú`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [plato] })
  });
  return await res.json();
}

async function actualizarPlato(id, cambios) {
  const res = await fetch(`${API_URL}/ID/${id}?sheet=Menú`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: cambios })
  });
  return await res.json();
}

async function eliminarPlato(id) {
  const res = await fetch(`${API_URL}/ID/${id}?sheet=Menú`, {
    method: "DELETE"
  });
  return await res.json();
}

// =====================
// PEDIDOS
// =====================

async function obtenerPedidos() {
  const res = await fetch(`${API_URL}?sheet=Pedidos`);
  const data = await res.json();
  return data;
}

async function crearPedido(pedido) {
  const res = await fetch(`${API_URL}?sheet=Pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [pedido] })
  });
  return await res.json();
}

async function actualizarEstadoPedido(idPedido, nuevoEstado) {
  const res = await fetch(`${API_URL}/ID_Pedido/${idPedido}?sheet=Pedidos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { Estado: nuevoEstado } })
  });
  return await res.json();
}

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
        container.innerHTML = '<p>Error al cargar el resumen. Intenta recargar la pagina.</p>';
    }
}

// =====================
// SUSCRIPCIONES
// =====================

async function obtenerSuscripciones() {
  const res = await fetch(`${API_URL}?sheet=Suscripciones`);
  const data = await res.json();
  return data;
}

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
// HU2: Pausar / Reanudar suscripcion (PUT)
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
      alert("No se encontro la suscripcion.");
      return;
    }

    const estadoActual = usuario.Estado_Suscripcion || "Activo";
    const nuevoEstado = estadoActual === "Activo" ? "Pausado" : "Activo";

    await actualizarEstadoSuscripcion(usuario.Nombre_vecino, nuevoEstado);
    alert("Suscripcion " + (nuevoEstado === "Activo" ? "reactivada" : "pausada"));
    return nuevoEstado;
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    alert("Error al actualizar la suscripcion.");
  }
}

// =============================================
// HU6: Calculo de Tiempo Estimado de Entrega
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
    console.warn("No se pudo verificar vehiculo, usando Bici por defecto.");
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

// HU4: Simulador de Cercania (asignacion automatica)
async function asignarRepartidorAutomatico(idPedido, distanciaKM) {
  try {
    const disponibles = await obtenerRepartidoresDisponibles();

    if (!disponibles || disponibles.length === 0) {
      alert("No hay repartidores disponibles en este momento.");
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

    console.log("Repartidor " + elegido.Nombre + " (" + elegido.Vehiculo + ") asignado al pedido " + idPedido + " - " + tiempoEstimado + " min");

    return {
      repartidor: elegido.Nombre,
      vehiculo: elegido.Vehiculo,
      tiempoEstimado: tiempoEstimado
    };
  } catch (error) {
    console.error("Error en asignacion automatica:", error);
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
  console.log("Pedido " + idPedido + " entregado. " + idRepartidor + " disponible de nuevo.");
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
// =============================================

async function obtenerCalificaciones() {
  const res = await fetch(`${API_URL}?sheet=Calificaciones`);
  return await res.json();
}

async function obtenerCalificacionesPorPlato(nombrePlato) {
  const res = await fetch(`${API_URL}/search?Nombre_Plato=${encodeURIComponent(nombrePlato)}&sheet=Calificaciones`);
  return await res.json();
}

async function registrarCalificacion(nombreCliente, nombrePlato, calificacion, comentario) {
  if (calificacion < 1 || calificacion > 5) {
    alert("La calificacion debe ser entre 1 y 5.");
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

  console.log("Calificacion registrada: " + nombrePlato + " - " + calificacion + "/5");
  return await res.json();
}

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
// =============================================

function generarFacturaDigital(pedido) {
  if (typeof window.jspdf === 'undefined') {
    alert("Error: jsPDF no esta cargado. Agrega el script en el HTML.");
    return null;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PICA PICA DELIVERY", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Comida casera de tu barrio", 105, 28, { align: "center" });

  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(1);
  doc.line(20, 33, 190, 33);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA DIGITAL", 105, 45, { align: "center" });

  const fechaActual = new Date().toLocaleDateString("es-BO");
  const horaActual = new Date().toLocaleTimeString("es-BO", { hour: '2-digit', minute: '2-digit' });
  const numFactura = "FAC-" + Date.now().toString().slice(-8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("N Factura: " + numFactura, 20, 55);
  doc.text("Fecha: " + fechaActual, 20, 62);
  doc.text("Hora: " + horaActual, 20, 69);

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 75, 190, 75);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Cliente", 20, 85);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Cliente: " + (pedido.Nombre_Cliente || "N/A"), 20, 93);
  doc.text("ID Pedido: " + (pedido.ID_Pedido || "N/A"), 20, 100);

  doc.line(20, 106, 190, 106);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle del Pedido", 20, 116);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Plato", 20, 126);
  doc.text("Cantidad", 110, 126);
  doc.text("Precio", 160, 126);

  doc.line(20, 129, 190, 129);

  doc.setFont("helvetica", "normal");
  doc.text(pedido.Nombre_Plato || "N/A", 20, 137);
  doc.text("1", 110, 137);
  doc.text("Bs " + (pedido.Precio || 0), 160, 137);

  doc.line(20, 142, 190, 142);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL: Bs " + (pedido.Precio || 0), 160, 155, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Estado de entrega: " + (pedido.Estado_Entrega || "Pendiente"), 20, 170);
  doc.text("Distancia: " + (pedido.Distancia_KM || "N/A") + " km", 20, 177);
  doc.text("Tiempo estimado: " + (pedido.Tiempo_Estimado_Min || "N/A") + " min", 20, 184);

  doc.setDrawColor(46, 125, 50);
  doc.line(20, 260, 190, 260);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Pica Pica Delivery - Comida casera ultra local", 105, 268, { align: "center" });
  doc.text("Santa Cruz, Bolivia | picapicadelivery@gmail.com", 105, 274, { align: "center" });
  doc.text("Este documento es una factura digital generada automaticamente.", 105, 280, { align: "center" });

  const nombreArchivo = "Factura_" + (pedido.Nombre_Cliente || "cliente") + "_" + (pedido.ID_Pedido || "pedido") + ".pdf";
  doc.save(nombreArchivo);

  console.log("Factura generada: " + nombreArchivo);
  return doc;
}

async function generarFacturaPorID(idPedido) {
  try {
    const pedidos = await obtenerPedidos();
    const pedido = pedidos.find(p => String(p.ID_Pedido) === String(idPedido));

    if (!pedido) {
      alert("No se encontro el pedido con ese ID.");
      return;
    }

    generarFacturaDigital(pedido);
    alert("Factura generada para el pedido " + idPedido);
  } catch (error) {
    console.error("Error al generar factura:", error);
    alert("Error al generar la factura.");
  }
}

// =============================================
// HU15: Enviar Factura por Email (EmailJS)
// Service ID: service_edz6dkr
// Template ID: template_bbnqs2d
// Public Key: krpWacbjY0J_94gjL (inicializado en el HTML)
// =============================================

async function enviarEmailFactura(emailDestino, pedido) {
  try {
    if (typeof emailjs === 'undefined') {
      console.warn("EmailJS no esta configurado.");
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

    const resultado = await emailjs.send("service_edz6dkr", "template_bbnqs2d", parametros);

    console.log("Email enviado a " + emailDestino);
    alert("Factura enviada a " + emailDestino);
    return resultado;
  } catch (error) {
    console.error("Error al enviar email:", error);
    alert("No se pudo enviar el email. La factura se descargo localmente.");
    return null;
  }
}

async function facturarYEnviar(idPedido, emailDestino) {
  try {
    const pedidos = await obtenerPedidos();
    const pedido = pedidos.find(p => String(p.ID_Pedido) === String(idPedido));

    if (!pedido) {
      alert("No se encontro el pedido.");
      return;
    }

    generarFacturaDigital(pedido);

    if (emailDestino) {
      await enviarEmailFactura(emailDestino, pedido);
    }

    console.log("Pedido " + idPedido + " facturado y enviado.");
  } catch (error) {
    console.error("Error en facturacion:", error);
  }
}

// =============================================
// HU14: Generar Reportes de Pagos y Suscripciones
// =============================================

async function obtenerPagosPorFecha(fechaInicio, fechaFin) {
  try {
    const pedidos = await obtenerPedidos();
    const lista = Array.isArray(pedidos) ? pedidos : [];

    const filtrados = lista.filter(p => {
      const fecha = p.Fecha || "";
      return fecha >= fechaInicio && fecha <= fechaFin;
    });

    filtrados.sort((a, b) => (a.Fecha || "").localeCompare(b.Fecha || ""));
    console.log(filtrados.length + " pagos encontrados entre " + fechaInicio + " y " + fechaFin);
    return filtrados;
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return [];
  }
}

async function obtenerPagosHoy() {
  const hoy = new Date().toISOString().slice(0, 10);
  return await obtenerPagosPorFecha(hoy, hoy);
}

async function obtenerTotalesPorSemana(fechaInicio, fechaFin) {
  try {
    const pedidos = await obtenerPagosPorFecha(fechaInicio, fechaFin);
    const semanas = {};

    pedidos.forEach(p => {
      const fecha = new Date(p.Fecha);
      const inicioAnio = new Date(fecha.getFullYear(), 0, 1);
      const dias = Math.floor((fecha - inicioAnio) / (24 * 60 * 60 * 1000));
      const numSemana = Math.ceil((dias + inicioAnio.getDay() + 1) / 7);
      const claveSemana = "Semana " + numSemana + " (" + fecha.getFullYear() + ")";

      if (!semanas[claveSemana]) {
        semanas[claveSemana] = {
          semana: claveSemana,
          totalPedidos: 0,
          totalIngresos: 0,
          pedidos: []
        };
      }

      semanas[claveSemana].totalPedidos++;
      semanas[claveSemana].totalIngresos += parseFloat(p.Precio) || 0;
      semanas[claveSemana].pedidos.push(p);
    });

    const resultado = Object.values(semanas);
    console.log("Totales por semana:", resultado);
    return resultado;
  } catch (error) {
    console.error("Error al calcular totales:", error);
    return [];
  }
}

async function generarReporteCompleto(fechaInicio, fechaFin) {
  try {
    const pedidos = await obtenerPagosPorFecha(fechaInicio, fechaFin);
    const suscripciones = await obtenerSuscripciones();

    const subsFiltradas = suscripciones.filter(s => {
      const fecha = s.Fecha || "";
      return fecha >= fechaInicio && fecha <= fechaFin;
    });

    const totalIngresosPedidos = pedidos.reduce((sum, p) => sum + (parseFloat(p.Precio) || 0), 0);
    const totalSuscripciones = subsFiltradas.length;
    const susActivas = subsFiltradas.filter(s => s.Estado_Suscripcion === "Activo").length;
    const susPausadas = subsFiltradas.filter(s => s.Estado_Suscripcion === "Pausado").length;

    const reporte = {
      periodo: fechaInicio + " a " + fechaFin,
      pedidos: {
        total: pedidos.length,
        ingresos: totalIngresosPedidos,
        detalle: pedidos
      },
      suscripciones: {
        total: totalSuscripciones,
        activas: susActivas,
        pausadas: susPausadas,
        detalle: subsFiltradas
      }
    };

    console.log("Reporte completo:", reporte);
    return reporte;
  } catch (error) {
    console.error("Error al generar reporte:", error);
    return null;
  }
}

async function exportarReporteExcel(fechaInicio, fechaFin) {
  try {
    const pedidos = await obtenerPagosPorFecha(fechaInicio, fechaFin);

    if (pedidos.length === 0) {
      alert("No hay datos para exportar en ese rango de fechas.");
      return;
    }

    const encabezados = ["ID_Pedido", "Nombre_Cliente", "Nombre_Plato", "Precio", "Fecha", "Estado", "Estado_Entrega", "ID_Repartidor"];
    
    const filas = pedidos.map(p => 
      encabezados.map(campo => '"' + (p[campo] || '').toString().replace(/"/g, '""') + '"')
      .join(",")
    );

    const totalIngresos = pedidos.reduce((sum, p) => sum + (parseFloat(p.Precio) || 0), 0);
    filas.push('"","","TOTAL","' + totalIngresos + '","","","",""');

    const csv = [encabezados.join(","), ...filas].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.setAttribute("download", "Reporte_Pagos_" + fechaInicio + "_a_" + fechaFin + ".csv");
    enlace.style.display = "none";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    console.log("CSV exportado: " + pedidos.length + " pedidos");
    alert("Reporte exportado: " + pedidos.length + " pedidos entre " + fechaInicio + " y " + fechaFin);
  } catch (error) {
    console.error("Error al exportar CSV:", error);
    alert("Error al exportar el reporte.");
  }
}

async function exportarReportePDF(fechaInicio, fechaFin) {
  try {
    if (typeof window.jspdf === 'undefined') {
      alert("Error: jsPDF no esta cargado.");
      return;
    }

    const pedidos = await obtenerPagosPorFecha(fechaInicio, fechaFin);
    const semanas = await obtenerTotalesPorSemana(fechaInicio, fechaFin);

    if (pedidos.length === 0) {
      alert("No hay datos para exportar en ese rango de fechas.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PICA PICA DELIVERY", 105, 18, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Pagos y Suscripciones", 105, 25, { align: "center" });

    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(1);
    doc.line(20, 30, 190, 30);

    doc.setFontSize(10);
    doc.text("Periodo: " + fechaInicio + " a " + fechaFin, 20, 40);
    doc.text("Fecha de generacion: " + new Date().toLocaleDateString("es-BO"), 20, 47);
    doc.text("Total de pedidos: " + pedidos.length, 20, 54);

    const totalIngresos = pedidos.reduce((sum, p) => sum + (parseFloat(p.Precio) || 0), 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INGRESOS TOTALES: Bs " + totalIngresos.toFixed(2), 20, 67);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 73, 190, 73);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Totales por Semana", 20, 82);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Semana", 20, 90);
    doc.text("Pedidos", 100, 90);
    doc.text("Ingresos (Bs)", 150, 90);
    doc.line(20, 93, 190, 93);

    doc.setFont("helvetica", "normal");
    let yPos = 100;

    semanas.forEach(s => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(s.semana, 20, yPos);
      doc.text(String(s.totalPedidos), 100, yPos);
      doc.text("Bs " + s.totalIngresos.toFixed(2), 150, yPos);
      yPos += 7;
    });

    yPos += 5;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Pedidos", 20, yPos);
    yPos += 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha", 20, yPos);
    doc.text("Cliente", 50, yPos);
    doc.text("Plato", 95, yPos);
    doc.text("Precio", 145, yPos);
    doc.text("Estado", 170, yPos);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    pedidos.forEach(p => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(p.Fecha || "", 20, yPos);
      doc.text((p.Nombre_Cliente || "").substring(0, 18), 50, yPos);
      doc.text((p.Nombre_Plato || "").substring(0, 20), 95, yPos);
      doc.text("Bs " + (p.Precio || 0), 145, yPos);
      doc.text((p.Estado_Entrega || "Pendiente").substring(0, 12), 170, yPos);
      yPos += 6;
    });

    const ultimaPagina = doc.internal.getNumberOfPages();
    for (let i = 1; i <= ultimaPagina; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("Pica Pica Delivery - Reporte generado automaticamente", 105, 290, { align: "center" });
      doc.text("Pagina " + i + " de " + ultimaPagina, 190, 290, { align: "right" });
    }

    const nombreArchivo = "Reporte_Pagos_" + fechaInicio + "_a_" + fechaFin + ".pdf";
    doc.save(nombreArchivo);

    console.log("Reporte PDF generado: " + nombreArchivo);
    alert("Reporte PDF generado: " + pedidos.length + " pedidos");
  } catch (error) {
    console.error("Error al generar reporte PDF:", error);
    alert("Error al generar el reporte PDF.");
  }
}

// =====================
// INTERFAZ - MENU Y TARJETAS
// =====================

const menuContainer = document.getElementById('menu-container');
const categoryButtonsContainer = document.getElementById('category-buttons');
const subscriptionForm = document.getElementById('subscription-form');
const subscriptionNameInput = document.getElementById('subscription-name');
const subscriptionFeedback = document.getElementById('subscription-feedback');

function crearTarjetaPlato(plato) {
  const linkImagen = plato.Imagen_Url; 

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

  const categorias = Array.from(new Set(platos.map(plato => plato.Categoria || 'Sin categoria')));
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

async function procesarPedidoRapido(nombrePlato, precioOriginal, idPlato = '') {
    let nombreCliente = window.usuarioLogueado;
    let precioFinal = window.usuarioLogueado ? 0 : precioOriginal;

    if (!window.usuarioLogueado) {
        nombreCliente = prompt("Ingresa tu nombre para el pedido:");
        if (!nombreCliente) return;
    }

    const ahora = new Date();
    const horaActual = String(ahora.getHours()).padStart(2, '0') + ":" + String(ahora.getMinutes()).padStart(2, '0');

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
        console.log("Procesando pedido:", nuevoPedido);
        await crearPedido(nuevoPedido);
        alert("Pedido realizado!\n" + nombrePlato + "\nPrecio: Bs " + precioFinal + "\nTiempo estimado: " + tiempoEstimado + " min");
        
        if(typeof cargarResumenPedidos === 'function') cargarResumenPedidos();
        if(typeof renderTracking === 'function') renderTracking();
        
        if(typeof dispararNotificacion === 'function') {
            dispararNotificacion("Pedido Confirmado", nombreCliente + " ordeno: " + nombrePlato);
        }
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        alert("Hubo un error al procesar el pedido. Intenta de nuevo.");
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
    console.log("Menu cargado:", window.menuData);
    renderCategoryButtons(window.menuData);
    renderMenu(window.menuData);
  } catch (error) {
    console.error('Error cargando el menu:', error);
    if (menuContainer) {
      menuContainer.innerHTML = '<p class="text-muted">No se pudo cargar el menu. Intenta recargar la pagina.</p>';
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

    mostrarFeedback('Registrando tu suscripcion...');

    try {
      await registrarSuscripcion({
        Nombre_vecino: nombre,
        Plan: 'Semanal',
        Fecha: new Date().toISOString().slice(0, 10)
      });

      mostrarFeedback("Gracias " + nombre + "! Tu plan semanal fue confirmado.");
      subscriptionForm.reset();
    } catch (error) {
      console.error('Error registrando suscripcion:', error);
      mostrarFeedback('No se pudo registrar la suscripcion. Intenta nuevamente.', true);
    }
  });
}

window.addEventListener('DOMContentLoaded', iniciarPagina);

// ============================================
// LOGICA PARA AÑADIR PLATOS (ADMIN)
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

        dishFeedback.textContent = "Subiendo plato al menu...";
        dishFeedback.style.color = "var(--color-primary)";

        try {
            const resultado = await agregarPlato(nuevoPlato);

            if (resultado) {
                dishFeedback.textContent = "Plato añadido con exito!";
                dishFeedback.style.color = "var(--color-primary-dark)";
                addDishForm.reset();
                if (typeof iniciarPagina === 'function') iniciarPagina();
            }
        } catch (error) {
            console.error("Error al añadir plato:", error);
            dishFeedback.textContent = "Error al conectar con la base de datos.";
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
                "Nuevo Pedido Recibido",
                (nuevoPedido.Nombre_Cliente || 'Un vecino') + " solicito: " + (nuevoPedido.Nombre_Plato || 'Almuerzo')
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
    return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + " min";
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
    if(!confirm("Confirmar reporte de retraso para el pedido " + idPedido + "?")) return;
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
