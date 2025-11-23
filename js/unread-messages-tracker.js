import {
  auth,
  onAuthStateChanged,
  rtdb,
  ref,
  onValue,
  off,
  get,
  update,
} from "./firebase-config.js";

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================
let currentUser = null;
let unreadListener = null;
let totalUnreadCount = 0;
let activeChatId = null;
let lastNotifiedMessages = new Set(); // Para evitar notificaciones duplicadas

// ============================================================================
// ELEMENTOS DEL DOM
// ============================================================================
const notificationBadge = document.querySelector(".count");
const userMenuNotification = document.getElementById("userMenuNotification");

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initializeUnreadTracker();
});

function initializeUnreadTracker() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      startTrackingUnreadMessages();
      setupActiveChatDetection();
      setupVisibilityChangeHandler();
    } else {
      stopTrackingUnreadMessages();
      updateUnreadBadges(0);
      lastNotifiedMessages.clear();
    }
  });
}

// ============================================================================
// DETECTAR CUANDO SE ABRE UN CHAT
// ============================================================================
function setupActiveChatDetection() {
  // Verificar parámetros de URL al cargar
  checkActiveChatFromURL();

  // Observar cambios en los elementos del DOM
  const observer = new MutationObserver(() => {
    const activeContact = document.querySelector(".contact-item.active");
    if (activeContact) {
      const newActiveChatId = activeContact.dataset.chatId;
      if (newActiveChatId !== activeChatId) {
        activeChatId = newActiveChatId;
        // Marcar como leído inmediatamente
        markChatAsRead(activeChatId);
      }
    } else {
      // No hay chat activo
      if (activeChatId !== null) {
        activeChatId = null;
      }
    }
  });

  // Observar cambios en la lista de contactos
  const contactsList = document.getElementById("contactsList");
  if (contactsList) {
    observer.observe(contactsList, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"],
    });
  }

  // Verificar periódicamente la URL para detectar cambios
  let lastUrl = window.location.href;
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      checkActiveChatFromURL();
    }
  }, 500);
}

function checkActiveChatFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const chatIdFromUrl = urlParams.get("chat");

  if (chatIdFromUrl && chatIdFromUrl !== activeChatId) {
    activeChatId = chatIdFromUrl;
    markChatAsRead(chatIdFromUrl);
  }
}

// ============================================================================
// MANEJAR CAMBIOS DE VISIBILIDAD
// ============================================================================
function setupVisibilityChangeHandler() {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && activeChatId && currentUser) {
      // La ventana se hace visible, marcar el chat activo como leído
      markChatAsRead(activeChatId);
    }
  });
}

// ============================================================================
// RASTREAR MENSAJES NO LEÍDOS
// ============================================================================
function startTrackingUnreadMessages() {
  if (!currentUser) return;

  const userChatsRef = ref(rtdb, `userChats/${currentUser.uid}`);

  // Limpiar listener anterior si existe
  if (unreadListener) {
    off(userChatsRef);
  }

  // Escuchar cambios en los chats del usuario
  unreadListener = onValue(userChatsRef, (snapshot) => {
    const chats = snapshot.val();
    if (chats) {
      calculateTotalUnread(chats);
      checkForNewMessages(chats);
    } else {
      updateUnreadBadges(0);
    }
  });
}

function stopTrackingUnreadMessages() {
  if (currentUser && unreadListener) {
    const userChatsRef = ref(rtdb, `userChats/${currentUser.uid}`);
    off(userChatsRef);
    unreadListener = null;
  }
  lastNotifiedMessages.clear();
}

// ============================================================================
// CALCULAR TOTAL DE MENSAJES NO LEÍDOS
// ============================================================================
function calculateTotalUnread(chats) {
  let total = 0;

  if (chats && typeof chats === "object") {
    Object.entries(chats).forEach(([chatId, chat]) => {
      // No contar mensajes del chat activo
      if (
        chatId !== activeChatId &&
        chat.unreadCount &&
        typeof chat.unreadCount === "number"
      ) {
        total += chat.unreadCount;
      }
    });
  }

  totalUnreadCount = total;
  updateUnreadBadges(total);
}

// ============================================================================
// ACTUALIZAR BADGES EN LA UI
// ============================================================================
function updateUnreadBadges(count) {
  // Actualizar badge en el menú de navegación (para desktop)
  if (notificationBadge) {
    if (count > 0) {
      notificationBadge.textContent = count > 99 ? "99+" : count;
      notificationBadge.style.display = "flex";
    } else {
      notificationBadge.style.display = "none";
    }
  }

  // Actualizar badge en el menú de usuario
  if (userMenuNotification) {
    if (count > 0) {
      userMenuNotification.textContent = count > 99 ? "99+" : count;
      userMenuNotification.style.display = "flex";
    } else {
      userMenuNotification.style.display = "none";
    }
  }

  // Actualizar título de la página
  updatePageTitle(count);

  // Actualizar favicon con notificación
  updateFavicon(count);
}

// ============================================================================
// ACTUALIZAR TÍTULO DE LA PÁGINA
// ============================================================================
function updatePageTitle(count) {
  const baseTitle = "Chat - VivArq";

  if (count > 0) {
    document.title = `(${count}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
}

// ============================================================================
// ACTUALIZAR FAVICON CON NOTIFICACIÓN
// ============================================================================
function updateFavicon(count) {
  const favicon = document.querySelector('link[rel="shortcut icon"]');
  if (!favicon) return;

  if (count === 0) {
    favicon.href = "images/Logo.png";
    return;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, 32, 32);

      // Dibujar círculo rojo
      ctx.fillStyle = "#ff4757";
      ctx.beginPath();
      ctx.arc(24, 8, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Dibujar texto
      ctx.fillStyle = "white";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(count > 9 ? "9+" : count.toString(), 24, 8);

      favicon.href = canvas.toDataURL("image/png");
    };
    img.src = "images/Logo.png";
  } catch (error) {
    console.error("Error al actualizar favicon:", error);
  }
}

// ============================================================================
// MARCAR CHAT COMO LEÍDO
// ============================================================================
async function markChatAsRead(chatId) {
  if (!currentUser || !chatId) return;

  try {
    const userChatRef = ref(rtdb, `userChats/${currentUser.uid}/${chatId}`);
    const snapshot = await get(userChatRef);

    if (snapshot.exists()) {
      const chatData = snapshot.val();
      if (chatData.unreadCount > 0) {
        await update(userChatRef, { unreadCount: 0 });

        // También marcar mensajes como leídos en la base de datos
        await markMessagesAsRead(chatId);
      }
    }
  } catch (error) {
    console.error("Error al marcar chat como leído:", error);
  }
}

// ============================================================================
// MARCAR MENSAJES INDIVIDUALES COMO LEÍDOS
// ============================================================================
async function markMessagesAsRead(chatId) {
  if (!currentUser || !chatId) return;

  try {
    const messagesRef = ref(rtdb, `messages/${chatId}`);
    const snapshot = await get(messagesRef);

    if (snapshot.exists()) {
      const messages = snapshot.val();
      const updates = {};

      Object.entries(messages).forEach(([messageId, message]) => {
        // Marcar como leído solo los mensajes del otro usuario que no están leídos
        if (message.senderId !== currentUser.uid && !message.read) {
          updates[`messages/${chatId}/${messageId}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
      }
    }
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
  }
}

// ============================================================================
// DETECTAR NUEVOS MENSAJES Y MOSTRAR NOTIFICACIONES
// ============================================================================
function checkForNewMessages(chats) {
  if (!currentUser || !chats) return;

  // Solo procesar si el documento está oculto (usuario no está viendo la página)
  if (!document.hidden) {
    return;
  }

  Object.entries(chats).forEach(([chatId, chatData]) => {
    // No mostrar notificación para el chat activo
    if (chatId === activeChatId) {
      return;
    }

    // Verificar si hay mensajes no leídos
    if (chatData.unreadCount > 0 && chatData.lastMessage) {
      const messageKey = `${chatId}_${chatData.lastMessageTime}`;

      // Evitar notificaciones duplicadas
      if (!lastNotifiedMessages.has(messageKey)) {
        lastNotifiedMessages.add(messageKey);

        // Limitar el tamaño del Set para evitar memory leaks
        if (lastNotifiedMessages.size > 100) {
          const firstItem = lastNotifiedMessages.values().next().value;
          lastNotifiedMessages.delete(firstItem);
        }

        // Obtener información del remitente y mostrar notificación
        getUserName(chatData.recipientId).then((senderName) => {
          showBrowserNotification(
            `Nuevo mensaje de ${senderName}`,
            chatData.lastMessage.substring(0, 100)
          );
        });
      }
    }
  });
}

// ============================================================================
// OBTENER NOMBRE DE USUARIO
// ============================================================================
async function getUserName(userId) {
  try {
    const statusRef = ref(rtdb, `status/${userId}`);
    const snapshot = await get(statusRef);
    const data = snapshot.val();
    return data?.displayName || "Usuario";
  } catch (error) {
    console.error("Error al obtener nombre de usuario:", error);
    return "Usuario";
  }
}

// ============================================================================
// OBTENER CONTADOR TOTAL
// ============================================================================
function getTotalUnreadCount() {
  return totalUnreadCount;
}

// ============================================================================
// NOTIFICACIONES DEL NAVEGADOR
// ============================================================================
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title, message) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body: message,
        icon: "images/Logo.png",
        badge: "images/Logo.png",
        tag: "vivarq-chat",
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = function () {
        window.focus();
        notification.close();
      };

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error("Error al mostrar notificación:", error);
    }
  }
}

// ============================================================================
// INICIALIZAR NOTIFICACIONES DEL NAVEGADOR
// ============================================================================
requestNotificationPermission();

// ============================================================================
// CLEANUP AL SALIR
// ============================================================================
window.addEventListener("beforeunload", () => {
  stopTrackingUnreadMessages();
});

// ============================================================================
// EXPORTAR FUNCIONES
// ============================================================================
export {
  getTotalUnreadCount,
  markChatAsRead,
  updateUnreadBadges,
  requestNotificationPermission,
  showBrowserNotification,
};
