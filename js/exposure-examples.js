// ========================================
// EJEMPLOS DE USO DEL SISTEMA DE EXPOSICIÓN
// ========================================

import { 
  actualizarExposicionUsuario,
  obtenerUsuariosConExposicion, 
  verificarPlanUsuario,
  simularPago,
  obtenerEstadisticasExposicion
} from './exposure-system.js';

// ========================================
// EJEMPLO 1: SIMULAR PAGO Y ACTIVAR PLAN
// ========================================

// Función que puedes llamar desde la consola para testear
async function testearSistemaPagos() {
  console.log("🧪 === INICIANDO PRUEBAS DEL SISTEMA ===");
  
  // Obtener el usuario actual (o usar un ID específico)
  const userId = localStorage.getItem("logguedInUserId");
  
  if (!userId) {
    console.log("❌ No hay usuario logueado");
    return;
  }

  console.log(`👤 Testing con usuario: ${userId}`);

  // 1. Verificar plan actual
  console.log("\n📋 1. Verificando plan actual...");
  const planActual = await verificarPlanUsuario(userId);
  console.log("Plan actual:", planActual);

  // 2. Simular pago de plan premium
  console.log("\n💳 2. Simulando pago de plan Premium...");
  const resultadoPago = await simularPago(userId, "premium");
  console.log("Resultado del pago:", resultadoPago);

  // 3. Verificar nuevo plan
  console.log("\n📋 3. Verificando nuevo plan...");
  const nuevoPlan = await verificarPlanUsuario(userId);
  console.log("Nuevo plan:", nuevoPlan);

  // 4. Obtener estadísticas
  console.log("\n📊 4. Estadísticas generales...");
  const stats = await obtenerEstadisticasExposicion();
  console.log("Estadísticas:", stats);

  console.log("✅ === PRUEBAS COMPLETADAS ===");
}

// ========================================
// EJEMPLO 2: ACTUALIZAR LISTADO CON EXPOSICIÓN
// ========================================

// Función para actualizar tu listado de usuarios ordenado por exposición
async function actualizarListadoUsuarios(containerId = "usersList") {
  try {
    console.log("🔄 Actualizando listado de usuarios...");
    
    const usuarios = await obtenerUsuariosConExposicion();
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.log("❌ No se encontró el contenedor:", containerId);
      return;
    }

    let html = '';
    
    usuarios.forEach((usuario, index) => {
      const userInfo = usuario.userInfo;
      const exposicion = usuario.exposicionData;
      const planName = getPlanName(exposicion.nivel);
      const badgeClass = getPlanBadgeClass(exposicion.nivel);
      
      html += `
        <div class="user-card ${exposicion.planActivo ? 'premium-user' : 'free-user'}" data-nivel="${exposicion.nivel}">
          <div class="user-header">
            <h3>${userInfo?.["2_Nombre y Apellido"] || "Usuario"}</h3>
            <span class="plan-badge ${badgeClass}">${planName}</span>
          </div>
          <div class="user-info">
            <p><strong>Profesión:</strong> ${userInfo?.["7_Profesión"] || "No especificada"}</p>
            <p><strong>Ubicación:</strong> ${userInfo?.["6_Ubicación"] || "No especificada"}</p>
            <p><strong>Experiencia:</strong> ${userInfo?.["8_Años de Experiencia"] || "No especificada"} años</p>
          </div>
          <div class="user-meta">
            <small>Posición en listado: #${index + 1}</small>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    console.log(`✅ Listado actualizado: ${usuarios.length} usuarios mostrados`);
    
  } catch (error) {
    console.error("❌ Error actualizando listado:", error);
  }
}

// Funciones auxiliares para el listado
function getPlanName(nivel) {
  const planes = {
    0: "Gratuito",
    1: "Básico", 
    2: "Premium",
    3: "VIP"
  };
  return planes[nivel] || "Gratuito";
}

function getPlanBadgeClass(nivel) {
  const clases = {
    0: "badge-free",
    1: "badge-basic",
    2: "badge-premium", 
    3: "badge-vip"
  };
  return clases[nivel] || "badge-free";
}

// ========================================
// EJEMPLO 3: FUNCIONES PARA BOTONES DE PAGO
// ========================================

// Función para cuando el usuario hace clic en "Comprar Plan Básico"
async function comprarPlanBasico() {
  const userId = localStorage.getItem("logguedInUserId");
  if (!userId) {
    alert("Debes estar logueado para comprar un plan");
    return;
  }

  // Mostrar loading
  mostrarLoadingPago("Procesando pago del Plan Básico...");
  
  try {
    const resultado = await simularPago(userId, "basico");
    
    if (resultado.success) {
      mostrarExitoPago(`¡${resultado.mensaje}! Ahora tienes mayor exposición en los listados.`);
      // Actualizar listado si existe
      actualizarListadoUsuarios();
    } else {
      mostrarErrorPago(resultado.mensaje);
    }
  } catch (error) {
    mostrarErrorPago("Error procesando el pago");
  }
}

// Función para cuando el usuario hace clic en "Comprar Plan Premium"  
async function comprarPlanPremium() {
  const userId = localStorage.getItem("logguedInUserId");
  if (!userId) {
    alert("Debes estar logueado para comprar un plan");
    return;
  }

  mostrarLoadingPago("Procesando pago del Plan Premium...");
  
  try {
    const resultado = await simularPago(userId, "premium");
    
    if (resultado.success) {
      mostrarExitoPago(`¡${resultado.mensaje}! Ahora tienes máxima exposición en los listados.`);
      actualizarListadoUsuarios();
    } else {
      mostrarErrorPago(resultado.mensaje);
    }
  } catch (error) {
    mostrarErrorPago("Error procesando el pago");
  }
}

// Función para cuando el usuario hace clic en "Comprar Plan VIP"
async function comprarPlanVIP() {
  const userId = localStorage.getItem("logguedInUserId");
  if (!userId) {
    alert("Debes estar logueado para comprar un plan");
    return;
  }

  mostrarLoadingPago("Procesando pago del Plan VIP...");
  
  try {
    const resultado = await simularPago(userId, "vip");
    
    if (resultado.success) {
      mostrarExitoPago(`¡${resultado.mensaje}! Ahora tienes exposición prioritaria absoluta.`);
      actualizarListadoUsuarios();
    } else {
      mostrarErrorPago(resultado.mensaje);
    }
  } catch (error) {
    mostrarErrorPago("Error procesando el pago");
  }
}

// ========================================
// FUNCIONES AUXILIARES PARA UI
// ========================================

function mostrarLoadingPago(mensaje) {
  // Implementar según tu sistema de mensajes
  console.log("⏳ " + mensaje);
  // Ejemplo: mostrar modal de loading
}

function mostrarExitoPago(mensaje) {
  // Implementar según tu sistema de mensajes
  console.log("✅ " + mensaje);
  alert(mensaje); // Temporal, reemplazar con tu sistema
}

function mostrarErrorPago(mensaje) {
  // Implementar según tu sistema de mensajes  
  console.log("❌ " + mensaje);
  alert(mensaje); // Temporal, reemplazar con tu sistema
}

// ========================================
// EJEMPLO 4: FUNCIÓN PARA VERIFICAR PLAN AL CARGAR PÁGINA
// ========================================

// Función para ejecutar al cargar cualquier página
async function verificarPlanAlCargar() {
  const userId = localStorage.getItem("logguedInUserId");
  if (!userId) return;

  try {
    const plan = await verificarPlanUsuario(userId);
    console.log("Plan del usuario:", plan);
    
    // Actualizar UI según el plan
    mostrarBadgePlan(plan);
    
    // Si estás en una página de listado, actualizar el ordenamiento
    if (document.getElementById("usersList")) {
      actualizarListadoUsuarios();
    }
    
  } catch (error) {
    console.error("Error verificando plan:", error);
  }
}

function mostrarBadgePlan(plan) {
  // Buscar elemento donde mostrar el badge del plan
  const badgeContainer = document.getElementById("userPlanBadge");
  if (!badgeContainer) return;
  
  const planName = getPlanName(plan.nivel);
  const badgeClass = getPlanBadgeClass(plan.nivel);
  
  badgeContainer.innerHTML = `
    <span class="plan-badge ${badgeClass}">
      ${planName}
      ${plan.planActivo ? '✨' : ''}
    </span>
  `;
}

// ========================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ========================================

// Hacer disponibles las funciones globalmente para testing
window.testearSistemaPagos = testearSistemaPagos;
window.comprarPlanBasico = comprarPlanBasico;
window.comprarPlanPremium = comprarPlanPremium;
window.comprarPlanVIP = comprarPlanVIP;
window.actualizarListadoUsuarios = actualizarListadoUsuarios;
window.verificarPlanAlCargar = verificarPlanAlCargar;

// Auto-ejecutar verificación al cargar
document.addEventListener('DOMContentLoaded', verificarPlanAlCargar);

console.log("🎯 Sistema de Exposición cargado. Funciones disponibles:");
console.log("- window.testearSistemaPagos()");
console.log("- window.comprarPlanBasico()");  
console.log("- window.comprarPlanPremium()");
console.log("- window.comprarPlanVIP()");
console.log("- window.actualizarListadoUsuarios()");
console.log("- window.verificarPlanAlCargar()");