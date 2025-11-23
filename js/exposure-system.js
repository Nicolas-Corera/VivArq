// ========================================
// SISTEMA DE EXPOSICIÓN - FUNCIONES PRINCIPALES
// ========================================

import {
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "./firebase-config.js";

// ========================================
// 1. FUNCIÓN PARA ACTUALIZAR EXPOSICIÓN (Simular pago)
// ========================================
export async function actualizarExposicionUsuario(userId, nivelExposicion) {
  try {
    const userRef = doc(db, "users", userId);

    // Obtener datos actuales del usuario
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error("Usuario no encontrado");
    }

    const userData = userDoc.data();

    // Actualizar con los nuevos campos de exposición
    const updatedUserData = {
      ...userData,
      exposicionData: {
        nivel: nivelExposicion, // 0 = gratis, 1 = básico, 2 = premium, 3 = VIP
        fechaActivacion: new Date().toISOString(),
        planActivo: nivelExposicion > 0,
        fechaVencimiento: calcularFechaVencimiento(nivelExposicion), // Opcional: para planes con duración
      },
    };

    await updateDoc(userRef, updatedUserData);

    console.log(
      `✅ Exposición actualizada: Usuario ${userId} ahora tiene nivel ${nivelExposicion}`
    );
    return { success: true, nivel: nivelExposicion };
  } catch (error) {
    console.error("❌ Error actualizando exposición:", error);
    return { success: false, error: error.message };
  }
}

// ========================================
// 2. FUNCIÓN PARA CALCULAR FECHA DE VENCIMIENTO
// ========================================
function calcularFechaVencimiento(nivelExposicion) {
  const ahora = new Date();
  const diasPorPlan = {
    0: 0, // Plan gratuito - sin vencimiento
    1: 30, // Plan básico - 30 días
    2: 30, // Plan premium - 30 días
    3: 30, // Plan VIP - 30 días
  };

  if (nivelExposicion === 0) return null;

  ahora.setDate(ahora.getDate() + diasPorPlan[nivelExposicion]);
  return ahora.toISOString();
}

// ========================================
// 3. FUNCIÓN PARA OBTENER USUARIOS ORDENADOS POR EXPOSICIÓN
// ========================================
export async function obtenerUsuariosConExposicion() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);

    const usuarios = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      usuarios.push({
        id: doc.id,
        ...userData,
        // Si no tiene exposicionData, asignar valores por defecto
        exposicionData: userData.exposicionData || {
          nivel: 0,
          planActivo: false,
          fechaActivacion: null,
        },
      });
    });

    // Ordenar por nivel de exposición (mayor a menor) y luego por fecha
    usuarios.sort((a, b) => {
      // Primero por nivel de exposición (descendente)
      if (b.exposicionData.nivel !== a.exposicionData.nivel) {
        return b.exposicionData.nivel - a.exposicionData.nivel;
      }

      // Si tienen el mismo nivel, ordenar por fecha de creación (más reciente primero)
      const fechaA = new Date(a.userInfo?.["4_Fecha de Creación"] || 0);
      const fechaB = new Date(b.userInfo?.["4_Fecha de Creación"] || 0);
      return fechaB - fechaA;
    });

    console.log(
      `📊 Usuarios obtenidos y ordenados por exposición: ${usuarios.length}`
    );
    return usuarios;
  } catch (error) {
    console.error("❌ Error obteniendo usuarios:", error);
    return [];
  }
}

// ========================================
// 4. FUNCIÓN PARA VERIFICAR ESTADO DEL PLAN
// ========================================
export async function verificarPlanUsuario(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { planActivo: false, nivel: 0, mensaje: "Usuario no encontrado" };
    }

    const userData = userDoc.data();
    const exposicionData = userData.exposicionData;

    if (!exposicionData || exposicionData.nivel === 0) {
      return {
        planActivo: false,
        nivel: 0,
        mensaje: "Plan gratuito",
      };
    }

    // Verificar si el plan ha vencido (si tiene fecha de vencimiento)
    if (exposicionData.fechaVencimiento) {
      const ahora = new Date();
      const vencimiento = new Date(exposicionData.fechaVencimiento);

      if (ahora > vencimiento) {
        // Plan vencido, actualizar a gratuito
        await actualizarExposicionUsuario(userId, 0);
        return {
          planActivo: false,
          nivel: 0,
          mensaje: "Plan vencido, regresado a gratuito",
        };
      }
    }

    return {
      planActivo: exposicionData.planActivo,
      nivel: exposicionData.nivel,
      fechaActivacion: exposicionData.fechaActivacion,
      fechaVencimiento: exposicionData.fechaVencimiento,
      mensaje: `Plan ${getNombrePlan(exposicionData.nivel)} activo`,
    };
  } catch (error) {
    console.error("❌ Error verificando plan:", error);
    return { planActivo: false, nivel: 0, mensaje: "Error verificando plan" };
  }
}

// ========================================
// 5. FUNCIÓN AUXILIAR PARA NOMBRES DE PLANES
// ========================================
function getNombrePlan(nivel) {
  const planes = {
    0: "Gratuito",
    1: "Básico",
    2: "Premium",
    3: "VIP",
  };
  return planes[nivel] || "Desconocido";
}

// ========================================
// 6. FUNCIÓN PARA SIMULAR DIFERENTES TIPOS DE PAGO (PARA TESTING)
// ========================================
export async function simularPago(userId, tipoPlan) {
  console.log(`🧪 SIMULANDO PAGO: Usuario ${userId}, Plan ${tipoPlan}`);

  const nivelesExposicion = {
    basico: 1,
    premium: 2,
    vip: 3,
  };

  const nivel = nivelesExposicion[tipoPlan.toLowerCase()] || 1;

  // Simular delay de procesamiento de pago
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const resultado = await actualizarExposicionUsuario(userId, nivel);

  if (resultado.success) {
    console.log(`✅ PAGO SIMULADO EXITOSO: Plan ${tipoPlan} activado`);
    return {
      success: true,
      mensaje: `Plan ${tipoPlan} activado correctamente`,
      nivel: nivel,
    };
  } else {
    console.log(`❌ ERROR EN PAGO SIMULADO: ${resultado.error}`);
    return {
      success: false,
      mensaje: `Error activando plan: ${resultado.error}`,
    };
  }
}

// ========================================
// 7. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE EXPOSICIÓN
// ========================================
export async function obtenerEstadisticasExposicion() {
  try {
    const usuarios = await obtenerUsuariosConExposicion();

    const stats = {
      total: usuarios.length,
      gratuitos: usuarios.filter((u) => u.exposicionData.nivel === 0).length,
      basicos: usuarios.filter((u) => u.exposicionData.nivel === 1).length,
      premium: usuarios.filter((u) => u.exposicionData.nivel === 2).length,
      vip: usuarios.filter((u) => u.exposicionData.nivel === 3).length,
    };

    console.log("📈 Estadísticas de exposición:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    return null;
  }
}
