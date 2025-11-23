import {
  auth,
  onAuthStateChanged,
  rtdb,
  ref,
  push,
  set,
  get,
  update,
  onValue,
  off,
  onChildAdded,
  onChildChanged,
  query,
  orderByChild,
  limitToLast,
  rtdbServerTimestamp,
  db,
  doc,
  getDoc,
} from "./firebase-config.js";
import { displayMessage } from "./displayMessage.js";

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================
let currentUser = null;
let activeChat = null;
let activeChatListener = null;
let contactsListener = null;
let currentRecipient = null;
let currentProject = null;
let messagesListeners = new Map();
let recipientStatusListener = null;

// ============================================================================
// ELEMENTOS DEL DOM
// ============================================================================
const elements = {
  // Contenedores principales
  emptyChat: document.getElementById("emptyChat"),
  activeChat: document.getElementById("activeChat"),
  projectPanel: document.getElementById("projectPanel"),

  // Sidebar
  contactsList: document.getElementById("contactsList"),
  contactsContainer: document.getElementById("contactsContainer"),
  emptyContactsState: document.getElementById("emptyContactsState"),
  searchContacts: document.getElementById("searchContacts"),

  // Chat activo
  messagesArea: document.getElementById("messagesArea"),
  messagesContainer: document.getElementById("messagesContainer"),
  messagesLoading: document.getElementById("messagesLoading"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),

  // Header del chat
  chatAvatar: document.getElementById("chatAvatar"),
  chatUserName: document.getElementById("chatUserName"),
  chatStatus: document.getElementById("chatStatus"),
  statusIndicator: document.getElementById("statusIndicator"),
  projectName: document.getElementById("projectName"),
  projectInfo: document.getElementById("projectInfo"),

  // Botones
  btnBack: document.getElementById("btnBack"),
  attachmentBtn: document.getElementById("attachmentBtn"),
  viewProfileBtn: document.getElementById("viewProfileBtn"),
  createComputoBtn: document.getElementById("createComputoBtn"),
  projectInfoBtn: document.getElementById("projectInfoBtn"),
  moreOptionsBtn: document.getElementById("moreOptionsBtn"),
  deleteChatBtn: document.getElementById("deleteChatBtn"),
  closePanelBtn: document.getElementById("closePanelBtn"),

  // Panel de proyecto
  projectImage: document.getElementById("projectImage"),
  projectTitle: document.getElementById("projectTitle"),
  projectLocation: document.getElementById("projectLocation"),
  projectDate: document.getElementById("projectDate"),
  projectBudget: document.getElementById("projectBudget"),
  projectDescription: document.getElementById("projectDescription"),
  viewProjectBtn: document.getElementById("viewProjectBtn"),
  generateComputoBtn: document.getElementById("generateComputoBtn"),
};

// ============================================================================
// INICIALIZACIÃ"N
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initializeChat();
  setupEventListeners();
});

function initializeChat() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const userRole =
        userData?.userInfo && userData.userInfo["5_Tipo de Cuenta"];
      if (userRole === "contractor") {
        if (elements.generateComputoBtn)
          generateComputoBtn.style.display = "none";
        if (elements.createComputoBtn) createComputoBtn.style.display = "none";
      }

      await updateUserStatus(true);
      await loadUserChats();
      checkURLParameters();
    } else {
      window.location.href = "login.html";
    }
  });
}

// ============================================================================
// DEBUGS
// ============================================================================

function listenForChatDeletion(chatId) {
  const chatRef = ref(rtdb, `chats/${chatId}`);

  onValue(chatRef, (snapshot) => {
    if (!snapshot.exists()) {
      // El chat fue eliminado por el otro usuario
      closeActiveChat();
      showInfo("Esta conversación fue eliminada");
    }
  });
}

// ============================================================================
// GESTIÃ"N DE PARÃMETROS URL
// ============================================================================
function checkURLParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const withUserId = urlParams.get("with");
  const projectId = urlParams.get("project");

  if (withUserId) {
    if (projectId) {
      // Chat relacionado con proyecto
      initiateChatWithProject(withUserId, projectId);
    } else {
      // Chat directo
      initiateDirectChat(withUserId);
    }
  }
}

async function initiateDirectChat(recipientId) {
  try {
    const chatId = generateChatId(currentUser.uid, recipientId);
    const recipientData = await getUserData(recipientId);

    if (!recipientData) {
      showError("Usuario no encontrado");
      return;
    }

    await ensureChatExists(chatId, recipientId, null);
    await openChat(chatId, recipientData, null);
  } catch (error) {
    console.error("Error al iniciar chat directo:", error);
    showError("Error al iniciar la conversaciÃ³n");
  }
}

async function initiateChatWithProject(recipientId, projectId) {
  try {
    const chatId = generateChatId(currentUser.uid, recipientId);
    const [recipientData, projectData] = await Promise.all([
      getUserData(recipientId),
      getProjectData(projectId),
    ]);

    if (!recipientData) {
      showError("Usuario no encontrado");
      return;
    }

    if (!projectData) {
      showError("Proyecto no encontrado");
      return;
    }

    await ensureChatExists(chatId, recipientId, projectId);
    await openChat(chatId, recipientData, projectData);
  } catch (error) {
    console.error("Error al iniciar chat con proyecto:", error);
    showError("Error al iniciar la conversaciÃ³n");
  }
}

// ============================================================================
// GENERAR ID DE CHAT
// ============================================================================
function generateChatId(userId1, userId2) {
  // Ordenar los IDs alfabÃ©ticamente para consistencia
  return [userId1, userId2].sort().join("_");
}

// ============================================================================
// ASEGURAR QUE EL CHAT EXISTE
// ============================================================================
async function ensureChatExists(chatId, recipientId, projectId = null) {
  try {
    const chatRef = ref(rtdb, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);

    if (!chatSnapshot.exists()) {
      // Crear nuevo chat
      const chatData = {
        participants: {
          [currentUser.uid]: true,
          [recipientId]: true,
        },
        createdAt: rtdbServerTimestamp(),
        lastMessage: null,
        lastMessageTime: null,
      };

      if (projectId) {
        chatData.projectId = projectId;
      }

      await set(chatRef, chatData);

      // Agregar referencia en userChats para ambos usuarios
      const updates = {};
      updates[`userChats/${currentUser.uid}/${chatId}`] = {
        recipientId: recipientId,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
        projectId: projectId || null,
      };

      updates[`userChats/${recipientId}/${chatId}`] = {
        recipientId: currentUser.uid,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
        projectId: projectId || null,
      };

      await update(ref(rtdb), updates);
    }
  } catch (error) {
    console.error("Error al crear chat:", error);
    throw error;
  }
}

// ============================================================================
// CARGAR CHATS DEL USUARIO
// ============================================================================
async function loadUserChats() {
  const userChatsRef = ref(rtdb, `userChats/${currentUser.uid}`);

  // Limpiar listener anterior
  if (contactsListener) {
    off(userChatsRef);
  }

  contactsListener = onValue(userChatsRef, async (snapshot) => {
    const chats = snapshot.val();

    if (!chats || Object.keys(chats).length === 0) {
      showEmptyContacts();
      return;
    }

    await renderContactsList(chats);
  });
}

async function renderContactsList(chats) {
  elements.emptyContactsState.style.display = "none";

  // Convertir a array y ordenar por último mensaje
  const chatsArray = Object.entries(chats).map(([chatId, chatData]) => ({
    chatId,
    ...chatData,
  }));

  chatsArray.sort((a, b) => {
    const timeA = a.lastMessageTime || 0;
    const timeB = b.lastMessageTime || 0;
    return timeB - timeA;
  });

  // Obtener IDs de chats actuales en el DOM
  const existingChatIds = new Set();
  const existingContacts =
    elements.contactsList.querySelectorAll(".contact-item");
  existingContacts.forEach((contact) => {
    existingChatIds.add(contact.dataset.chatId);
  });

  // Crear un mapa de chats nuevos
  const newChatIds = new Set(chatsArray.map((chat) => chat.chatId));

  // Eliminar contactos que ya no existen
  existingContacts.forEach((contact) => {
    const chatId = contact.dataset.chatId;
    if (!newChatIds.has(chatId)) {
      contact.remove();
    }
  });

  // Actualizar o agregar contactos
  for (const chat of chatsArray) {
    const existingContact = elements.contactsList.querySelector(
      `[data-chat-id="${chat.chatId}"]`
    );

    if (existingContact) {
      // Actualizar contacto existente
      await updateContactItem(existingContact, chat);
    } else {
      // Agregar nuevo contacto
      await renderContactItem(chat);
    }
  }

  // Reordenar los elementos en el DOM según el orden del array
  chatsArray.forEach((chat, index) => {
    const contactElement = elements.contactsList.querySelector(
      `[data-chat-id="${chat.chatId}"]`
    );
    if (contactElement) {
      elements.contactsList.appendChild(contactElement);
    }
  });
}

// Nueva función para actualizar un contacto existente
async function updateContactItem(contactDiv, chat) {
  try {
    const recipientData = await getUserData(chat.recipientId);
    if (!recipientData) return;

    let projectData = null;
    if (chat.projectId) {
      projectData = await getProjectData(chat.projectId);
    }

    const lastMessage = chat.lastMessage || "Sin mensajes";
    const unreadCount = chat.unreadCount || 0;
    const time = chat.lastMessageTime
      ? formatMessageTime(chat.lastMessageTime)
      : "";

    // Mantener la clase active si el chat está activo
    const isActive = contactDiv.classList.contains("active");

    // Actualizar solo el contenido necesario
    const contactTimeElement = contactDiv.querySelector(".contact-time");
    if (contactTimeElement) {
      contactTimeElement.textContent = time;
    }

    const lastMessageElement = contactDiv.querySelector(".last-message");
    if (lastMessageElement) {
      lastMessageElement.textContent = truncateText(lastMessage, 50);
    }

    // Actualizar o remover el badge de unreadCount
    const contactLastMessageDiv = contactDiv.querySelector(
      ".contact-last-message"
    );
    if (contactLastMessageDiv) {
      let unreadBadge = contactLastMessageDiv.querySelector(".unread-count");

      // Si es el chat activo, SIEMPRE remover el badge
      if (chat.chatId === activeChat) {
        if (unreadBadge) {
          unreadBadge.remove();
        }
      } else if (unreadCount > 0) {
        if (unreadBadge) {
          // Actualizar badge existente
          unreadBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
        } else {
          // Crear nuevo badge
          unreadBadge = document.createElement("span");
          unreadBadge.className = "unread-count";
          unreadBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
          contactLastMessageDiv.appendChild(unreadBadge);
        }
      } else {
        // Remover badge si existe y no hay mensajes no leídos
        if (unreadBadge) {
          unreadBadge.remove();
        }
      }
    }

    // Restaurar la clase active si estaba activa
    if (isActive && !contactDiv.classList.contains("active")) {
      contactDiv.classList.add("active");
    }
  } catch (error) {
    console.error("Error al actualizar contacto:", error);
  }
}

async function renderContactItem(chat) {
  try {
    const recipientData = await getUserData(chat.recipientId);
    if (!recipientData) return;

    let projectData = null;
    if (chat.projectId) {
      projectData = await getProjectData(chat.projectId);
    }

    const contactDiv = document.createElement("div");
    contactDiv.className = `contact-item ${
      activeChat === chat.chatId ? "active" : ""
    }`;
    contactDiv.dataset.chatId = chat.chatId;

    const avatar = recipientData.profilePicture || "";
    const displayName = recipientData.displayName || "Usuario";
    const lastMessage = chat.lastMessage || "Sin mensajes";
    const unreadCount = chat.unreadCount || 0;
    const time = chat.lastMessageTime
      ? formatMessageTime(chat.lastMessageTime)
      : "";

    contactDiv.innerHTML = `
      <div class="contact-avatar">
        ${
          avatar
            ? `<img src="${avatar}" alt="${displayName}">`
            : `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`
        }
      </div>
      <div class="contact-info">
        <div class="contact-header">
          <h4 class="contact-name">${displayName}</h4>
          <span class="contact-time">${time}</span>
        </div>
        ${
          projectData
            ? `<div class="contact-project">
            <i class="fas fa-briefcase"></i>
            <span>${projectData.title}</span>
          </div>`
            : ""
        }
        <div class="contact-last-message">
          <p class="last-message">${truncateText(lastMessage, 50)}</p>
      ${
        unreadCount > 0 && chat.chatId !== activeChat
          ? `<span class="unread-count">${
              unreadCount > 99 ? "99+" : unreadCount
            }</span>`
          : ""
      }
        </div>
      </div>
    `;

    contactDiv.addEventListener("click", () => {
      openChat(chat.chatId, recipientData, projectData);
    });

    elements.contactsList.appendChild(contactDiv);
  } catch (error) {
    console.error("Error al renderizar contacto:", error);
  }
}

// ============================================================================
// ABRIR CHAT
// ============================================================================
// ============================================================================
// ABRIR CHAT (CON PREVENCIÓN DE DUPLICADOS)
// ============================================================================
async function openChat(chatId, recipientData, projectData = null) {
  try {
    // Limpiar listeners anteriores
    cleanupActiveChat();

    activeChat = chatId;
    currentRecipient = recipientData;
    currentProject = projectData;

    // Actualizar UI
    elements.emptyChat.style.display = "none";
    elements.activeChat.style.display = "flex";
    elements.messagesLoading.style.display = "flex";
    elements.messagesContainer.innerHTML = "";

    // Actualizar header
    updateChatHeader(recipientData, projectData);

    // Marcar contacto como activo
    updateActiveContact(chatId);

    // Marcar mensajes como leÃ­dos
    await markMessagesAsRead(chatId);

    // Cargar mensajes
    loadMessages(chatId);

    listenForChatDeletion(activeChat);

    // Limpiar URL
    window.history.replaceState({}, "", "chat.html");

    // Scroll al Ã¡rea de mensajes en mÃ³vil
    if (window.innerWidth <= 768) {
      elements.activeChat.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Error al abrir chat:", error);
    showError("Error al cargar la conversaciÃ³n");
  }
}

function updateChatHeader(recipientData, projectData) {
  // Avatar
  const chatAvatarContainer = elements.chatAvatar.parentElement;

  if (recipientData.profilePicture) {
    elements.chatAvatar.src = recipientData.profilePicture;
    elements.chatAvatar.style.display = "block";
    elements.chatAvatar.alt = recipientData.displayName || "Usuario";
  } else {
    // Si no hay imagen, crear un placeholder con Ã­cono
    elements.chatAvatar.style.display = "none";
    if (!chatAvatarContainer.querySelector(".avatar-placeholder")) {
      const placeholder = document.createElement("div");
      placeholder.className = "avatar-placeholder";
      placeholder.innerHTML = '<i class="fas fa-user"></i>';
      placeholder.style.cssText = `
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--chat-primary-light);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--chat-primary);
        font-size: 20px;
      `;
      chatAvatarContainer.appendChild(placeholder);
    }
  }

  // Nombre
  elements.chatUserName.textContent = recipientData.displayName || "Usuario";

  // Estado online/offline
  updateRecipientStatus(recipientData.userId);

  // InformaciÃ³n del proyecto
  if (projectData) {
    elements.projectInfo.style.display = "flex";
    elements.projectName.textContent = projectData.title;
    elements.projectInfoBtn.style.display = "flex";
    // elements.createComputoBtn.style.display = "flex";
  } else {
    elements.projectInfo.style.display = "none";
    elements.projectInfoBtn.style.display = "none";
    // elements.createComputoBtn.style.display = "none";
  }
}

function updateRecipientStatus(recipientId) {
  const statusRef = ref(rtdb, `status/${recipientId}`);

  // Limpiar listener anterior si existe
  if (recipientStatusListener) {
    off(statusRef);
    recipientStatusListener = null;
  }

  recipientStatusListener = onValue(statusRef, (snapshot) => {
    const status = snapshot.val();

    // IMPORTANTE: Remover todas las clases antes de agregar nuevas
    elements.statusIndicator.classList.remove("online", "disconnected");

    if (status && status.state === "online") {
      elements.chatStatus.textContent = "En línea";
      elements.statusIndicator.classList.add("online");
    } else if (status && status.lastChanged) {
      const lastSeen = new Date(status.lastChanged);
      elements.chatStatus.textContent = `Últ. vez ${formatLastSeen(lastSeen)}`;
      elements.statusIndicator.classList.add("disconnected");
    } else {
      elements.chatStatus.textContent = "Desconectado";
      elements.statusIndicator.classList.add("disconnected");
    }
  });
}

function updateActiveContact(chatId) {
  document.querySelectorAll(".contact-item").forEach((item) => {
    if (item.dataset.chatId === chatId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// ============================================================================
// CARGAR MENSAJES
// ============================================================================
function loadMessages(chatId) {
  const messagesRef = ref(rtdb, `messages/${chatId}`);
  const messagesQuery = query(messagesRef, orderByChild("timestamp"));

  // Limpiar listener anterior
  if (activeChatListener) {
    off(messagesRef);
    activeChatListener = null;
  }

  elements.messagesLoading.style.display = "flex";
  elements.messagesContainer.innerHTML = "";

  // Escuchar mensajes existentes
  get(messagesQuery)
    .then((snapshot) => {
      elements.messagesLoading.style.display = "none";

      if (snapshot.exists()) {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
          messages.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        renderMessages(messages);
        scrollToBottom();
      } else {
        // No hay mensajes todavÃ­a
        elements.messagesContainer.innerHTML = `
          <div class="no-messages">
            <i class="fas fa-comments"></i>
            <p>No hay mensajes aún. ¡Inicia la conversación!</p>
          </div>
        `;
      }
    })
    .catch((error) => {
      console.error("Error al cargar mensajes:", error);
      elements.messagesLoading.style.display = "none";
      showError("Error al cargar mensajes");
    });

  // Escuchar nuevos mensajes en tiempo real
  const lastMessageTimestamp = Date.now();

  activeChatListener = onChildAdded(messagesRef, (snapshot) => {
    const message = {
      id: snapshot.key,
      ...snapshot.val(),
    };

    // Solo agregar si el mensaje es nuevo (despuÃ©s de cargar)
    if (message.timestamp > lastMessageTimestamp) {
      // Verificar que no exista ya
      if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
        // Eliminar mensaje de "no hay mensajes" si existe
        const noMessages =
          elements.messagesContainer.querySelector(".no-messages");
        if (noMessages) {
          noMessages.remove();
        }

        appendMessage(message);
        scrollToBottom();

        // Marcar como leÃ­do si el mensaje es del otro usuario
        if (message.senderId !== currentUser.uid) {
          markMessageAsRead(chatId, message.id);
        }
      }
    }
  });

  // Escuchar cambios en mensajes (para el estado de leÃ­do)
  onChildChanged(messagesRef, (snapshot) => {
    const messageId = snapshot.key;
    const updatedData = snapshot.val();
    updateMessageStatus(messageId, updatedData);
  });
}

function renderMessages(messages) {
  elements.messagesContainer.innerHTML = "";

  if (!messages || messages.length === 0) {
    elements.messagesContainer.innerHTML = `
      <div class="no-messages">
        <i class="fas fa-comments"></i>
        <p>No hay mensajes aÃºn. Â¡Inicia la conversaciÃ³n!</p>
      </div>
    `;
    return;
  }

  let lastDate = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp);
    const dateString = formatDateSeparator(messageDate);

    // Agregar separador de fecha si es necesario
    if (dateString !== lastDate) {
      const dateSeparator = document.createElement("div");
      dateSeparator.className = "date-separator";
      dateSeparator.innerHTML = `<span>${dateString}</span>`;
      elements.messagesContainer.appendChild(dateSeparator);
      lastDate = dateString;
    }

    appendMessage(message);
  });
}

function appendMessage(message) {
  const messageDiv = document.createElement("div");
  const isSent = message.senderId === currentUser.uid;

  messageDiv.className = `message ${isSent ? "sent" : "received"}`;
  messageDiv.dataset.messageId = message.id;

  const time = new Date(message.timestamp).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <div class="message-content">
      <p class="message-text">${escapeHtml(message.text)}</p>
      <div class="message-footer">
        <span class="message-time">${time}</span>
        ${
          isSent
            ? `<i class="message-status fas ${
                message.read ? "fa-check-double read" : "fa-check"
              }"></i>`
            : ""
        }
      </div>
    </div>
  `;

  elements.messagesContainer.appendChild(messageDiv);
}

function updateMessageStatus(messageId, data) {
  const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageDiv) return;

  const statusIcon = messageDiv.querySelector(".message-status");
  if (statusIcon && data.read) {
    statusIcon.classList.remove("fa-check");
    statusIcon.classList.add("fa-check-double", "read");
  }
}

// ============================================================================
// ENVIAR MENSAJE
// ============================================================================
async function sendMessage() {
  const text = elements.messageInput.value.trim();

  if (!text || !activeChat || !currentUser) return;

  try {
    const messagesRef = ref(rtdb, `messages/${activeChat}`);
    const newMessageRef = push(messagesRef);

    const messageData = {
      senderId: currentUser.uid,
      text: text,
      timestamp: rtdbServerTimestamp(),
      read: false,
    };

    elements.messageInput.value = "";
    await set(newMessageRef, messageData);

    // Actualizar Ãºltimo mensaje en el chat
    const updates = {};

    // Actualizar en chats
    updates[`chats/${activeChat}/lastMessage`] = text;
    updates[`chats/${activeChat}/lastMessageTime`] = Date.now();

    // Actualizar en userChats para el usuario actual
    updates[`userChats/${currentUser.uid}/${activeChat}/lastMessage`] = text;
    updates[`userChats/${currentUser.uid}/${activeChat}/lastMessageTime`] =
      Date.now();

    // Actualizar en userChats para el destinatario e incrementar unreadCount
    updates[`userChats/${currentRecipient.userId}/${activeChat}/lastMessage`] =
      text;
    updates[
      `userChats/${currentRecipient.userId}/${activeChat}/lastMessageTime`
    ] = Date.now();

    // Obtener el unreadCount actual del destinatario
    const recipientChatRef = ref(
      rtdb,
      `userChats/${currentRecipient.userId}/${activeChat}`
    );
    const recipientChatSnapshot = await get(recipientChatRef);
    const currentUnreadCount = recipientChatSnapshot.val()?.unreadCount || 0;

    updates[`userChats/${currentRecipient.userId}/${activeChat}/unreadCount`] =
      currentUnreadCount + 1;

    await update(ref(rtdb), updates);

    // Limpiar input

    elements.messageInput.style.height = "auto";
    elements.sendBtn.disabled = true;

    // Enviar notificaciÃ³n si el destinatario estÃ¡ offline
    await sendNotificationIfOffline(currentRecipient.userId, text);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    showError("Error al enviar el mensaje");
  }
}

async function sendNotificationIfOffline(recipientId, messageText) {
  try {
    const statusRef = ref(rtdb, `status/${recipientId}`);
    const statusSnapshot = await get(statusRef);
    const status = statusSnapshot.val();

    if (!status || status.state !== "online") {
      // El usuario estÃ¡ offline, aquÃ­ podrÃ­as implementar notificaciones push
      console.log("Usuario offline, enviar notificaciÃ³n:", messageText);
    }
  } catch (error) {
    console.error("Error al verificar estado del usuario:", error);
  }
}

// ============================================================================
// MARCAR MENSAJES COMO LEÃDOS
// ============================================================================
async function markMessagesAsRead(chatId) {
  try {
    const messagesRef = ref(rtdb, `messages/${chatId}`);
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) return;

    const updates = {};
    let unreadCount = 0;

    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (message.senderId !== currentUser.uid && !message.read) {
        updates[`messages/${chatId}/${childSnapshot.key}/read`] = true;
        unreadCount++;
      }
    });

    if (Object.keys(updates).length > 0) {
      // Actualizar mensajes como leÃ­dos
      updates[`userChats/${currentUser.uid}/${chatId}/unreadCount`] = 0;
      await update(ref(rtdb), updates);
    }
  } catch (error) {
    console.error("Error al marcar mensajes como leÃ­dos:", error);
  }
}

async function markMessageAsRead(chatId, messageId) {
  try {
    const messageRef = ref(rtdb, `messages/${chatId}/${messageId}`);
    const snapshot = await get(messageRef);

    if (snapshot.exists()) {
      const message = snapshot.val();
      if (message.senderId !== currentUser.uid && !message.read) {
        await update(messageRef, { read: true });

        // Decrementar unreadCount
        const userChatRef = ref(rtdb, `userChats/${currentUser.uid}/${chatId}`);
        const userChatSnapshot = await get(userChatRef);
        const currentUnreadCount = userChatSnapshot.val()?.unreadCount || 0;

        if (currentUnreadCount > 0) {
          await update(userChatRef, {
            unreadCount: currentUnreadCount - 1,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error al marcar mensaje como leÃ­do:", error);
  }
}

// ============================================================================
// ELIMINAR CHAT
// ============================================================================
async function deleteChat() {
  if (!activeChat || !currentRecipient) return;

  // Abrir modal personalizado
  const confirmed = await openDeleteModal();
  if (!confirmed) return;

  try {
    const chatId = activeChat;
    const recipientId = currentRecipient.userId;

    const updates = {};
    updates[`userChats/${currentUser.uid}/${chatId}`] = null;
    updates[`userChats/${recipientId}/${chatId}`] = null;
    updates[`messages/${chatId}`] = null;
    updates[`chats/${chatId}`] = null;

    await update(ref(rtdb), updates);

    closeActiveChat();

    displayMessage("Conversación eliminada correctamente", "success");
  } catch (error) {
    console.error("Error al eliminar chat:", error);
    displayMessage("Error al eliminar la conversación", "error");
  }
}

function openDeleteModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("deleteModal");
    const confirmBtn = document.getElementById("confirmDelete");
    const cancelBtn = document.getElementById("cancelDelete");

    modal.classList.remove("hidden");

    // Confirmar
    confirmBtn.onclick = () => {
      modal.classList.add("hidden");
      resolve(true);
    };

    // Cancelar
    cancelBtn.onclick = () => {
      modal.classList.add("hidden");
      resolve(false);
    };
  });
}

const moreOptionsBtn = document.getElementById("moreOptionsBtn");
const moreOptionsModal = document.getElementById("moreOptionsModal");

/* --- ABRIR / CERRAR DROPDOWN --- */
moreOptionsBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // No se cierra al abrir

  moreOptionsModal.classList.toggle("hidden");
  moreOptionsModal.classList.toggle("active");
});

/* --- CLICKS DENTRO DEL MODAL NO LO CIERRAN --- */
moreOptionsModal.addEventListener("click", (e) => {
  e.stopPropagation();
});

projectInfoBtn.addEventListener("click", () => {
  moreOptionsModal.classList.add("hidden");
  moreOptionsModal.classList.remove("active");
});

/* --- CERRAR EN CUALQUIER CLICK POR FUERA O EN OTRO BOTÓN --- */
document.addEventListener("click", (e) => {
  // Si el click NO es el botón que lo abre y NO es dentro del modal → CERRAR
  if (!moreOptionsModal.contains(e.target) && e.target !== moreOptionsBtn) {
    moreOptionsModal.classList.add("hidden");
    moreOptionsModal.classList.remove("active");
  }
});

// ============================================================================
// BUSCAR CONTACTOS
// ============================================================================
function searchContacts(searchTerm) {
  const contacts = document.querySelectorAll(".contact-item");

  contacts.forEach((contact) => {
    const name = contact
      .querySelector(".contact-name")
      .textContent.toLowerCase();
    const lastMessage = contact
      .querySelector(".last-message")
      .textContent.toLowerCase();

    if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
      contact.style.display = "flex";
    } else {
      contact.style.display = "none";
    }
  });
}

// ============================================================================
// PANEL DE INFORMACIÃ"N DEL PROYECTO
// ============================================================================
// REEMPLAZA esta función en chat.js

function showProjectPanel() {
  if (!currentProject) return;

  elements.projectPanel.style.display = "flex";

  // Parsear la fecha correctamente
  let projectDate = "-";
  if (currentProject.createdAt) {
    try {
      // Si es Timestamp de Firebase
      const date = currentProject.createdAt.toDate
        ? currentProject.createdAt.toDate()
        : new Date(currentProject.createdAt);

      // Validar que sea una fecha válida
      if (!isNaN(date.getTime())) {
        projectDate = date.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    } catch (error) {
      console.error("Error al parsear fecha:", error);
    }
  }

  // Actualizar información del proyecto
  elements.projectImage.src =
    currentProject.images?.[0]?.secure_url ||
    "https://placehold.co/600x400?text=Sin+Imagen";
  elements.projectTitle.textContent = currentProject.title || "Sin título";
  elements.projectLocation.textContent = currentProject.location || "-";
  elements.projectDate.textContent = projectDate;
  elements.projectBudget.textContent = currentProject.budget
    ? `$${Number(currentProject.budget).toLocaleString("es-AR")}`
    : "-";
  elements.projectDescription.textContent =
    currentProject.description || "Sin descripción disponible.";
}

function closeProjectPanel() {
  elements.projectPanel.style.display = "none";
}

// ============================================================================
// CERRAR CHAT ACTIVO
// ============================================================================
function closeActiveChat() {
  cleanupActiveChat();

  elements.activeChat.style.display = "none";
  elements.emptyChat.style.display = "flex";
  elements.projectPanel.style.display = "none";

  activeChat = null;
  currentRecipient = null;
  currentProject = null;
}

function cleanupActiveChat() {
  // Limpiar listener de mensajes
  if (activeChat && activeChatListener) {
    const messagesRef = ref(rtdb, `messages/${activeChat}`);
    off(messagesRef);
    activeChatListener = null;
  }

  // Limpiar listener de estado del destinatario
  if (recipientStatusListener && currentRecipient) {
    const statusRef = ref(rtdb, `status/${currentRecipient.userId}`);
    off(statusRef);
    recipientStatusListener = null;
  }
}

// ============================================================================
// ESTADO DEL USUARIO (ONLINE/OFFLINE)
// ============================================================================
async function updateUserStatus(isOnline) {
  if (!currentUser) return;

  try {
    const statusRef = ref(rtdb, `status/${currentUser.uid}`);

    if (isOnline) {
      // Obtener datos del usuario de Firestore
      const userData = await getUserFirestoreData(currentUser.uid);
      const displayName =
        userData?.name ||
        userData?.displayName ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Usuario";

      await set(statusRef, {
        state: "online",
        lastChanged: Date.now(),
        displayName: displayName,
      });

      // Cuando el usuario se desconecta
      const offlineData = {
        state: "offline",
        lastChanged: Date.now(),
        displayName: displayName,
      };

      // Usar onDisconnect para actualizar cuando se desconecte
      const { onDisconnect } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js"
      );
      await onDisconnect(statusRef).set(offlineData);
    } else {
      const currentStatus = await get(statusRef);
      const displayName = currentStatus.val()?.displayName || "Usuario";

      await update(statusRef, {
        state: "offline",
        lastChanged: Date.now(),
        displayName: displayName,
      });
    }
  } catch (error) {
    console.error("Error al actualizar estado del usuario:", error);
  }
}

// ============================================================================
// OBTENER DATOS DE USUARIO
// ============================================================================
async function getUserData(userId) {
  try {
    // Obtener de Firestore desde la colecciÃ³n userData
    const userDoc = await getDoc(doc(db, "userData", userId));

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        userId: userId,
        displayName: data.name || data.displayName || "Usuario",
        name: data.name || data.displayName || "Usuario",
        profilePicture: data.profilePicture || data.profileImage || null,
        email: data.email || null,
        accountType: data["5_Tipo de Cuenta"] || null,
        ...data,
      };
    }

    // Si no existe en userData, intentar en users
    const userDocAlt = await getDoc(doc(db, "users", userId));
    if (userDocAlt.exists()) {
      const data = userDocAlt.data();
      const userInfo = data.userInfo || {};
      return {
        userId: userId,
        displayName:
          userInfo["2_Nombre y Apellido"] ||
          data.name ||
          data.displayName ||
          "Usuario",
        name:
          userInfo["2_Nombre y Apellido"] ||
          data.name ||
          data.displayName ||
          "Usuario",
        profilePicture:
          userInfo["13_Foto de Perfil"] ||
          data.profilePicture ||
          data.profileImage ||
          null,
        email: userInfo["1_Email"] || data.email || null,
        accountType: userInfo["5_Tipo de Cuenta"] || null,
        ...data,
      };
    }

    return {
      userId: userId,
      displayName: "Usuario",
      name: "Usuario",
      profilePicture: null,
      accountType: null,
    };
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
    return {
      userId: userId,
      displayName: "Usuario",
      name: "Usuario",
      profilePicture: null,
      accountType: null,
    };
  }
}

async function getUserFirestoreData(userId) {
  try {
    const userDoc = await getDoc(doc(db, "userData", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }

    // Fallback a users
    const userDocAlt = await getDoc(doc(db, "users", userId));
    if (userDocAlt.exists()) {
      return userDocAlt.data();
    }

    return null;
  } catch (error) {
    console.error("Error al obtener datos de Firestore:", error);
    return null;
  }
}

// ============================================================================
// OBTENER DATOS DEL PROYECTO
// ============================================================================
async function getProjectData(projectId) {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (projectDoc.exists()) {
      return {
        id: projectId,
        ...projectDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error al obtener datos del proyecto:", error);
    return null;
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================
function showEmptyContacts() {
  elements.emptyContactsState.style.display = "flex";
  elements.contactsList.innerHTML = "";
}

function scrollToBottom() {
  setTimeout(() => {
    elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
  }, 10);
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 2) {
    return "Ayer";
  } else if (diffDays <= 7) {
    return date.toLocaleDateString("es-AR", { weekday: "short" });
  } else {
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    });
  }
}

function formatDateSeparator(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "Hoy";
  } else if (diffDays === 2) {
    return "Ayer";
  } else if (diffDays <= 7) {
    return date.toLocaleDateString("es-AR", { weekday: "long" });
  } else {
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}

function formatLastSeen(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "ahora";
  } else if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return "ayer";
  } else {
    return `hace ${diffDays}d`;
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function showError(message) {
  alert(message);
}

function showSuccess(message) {
  alert(message);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  // Input de mensaje
  elements.messageInput.addEventListener("input", (e) => {
    // Auto-resize del textarea
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";

    // Habilitar/deshabilitar botÃ³n de enviar
    elements.sendBtn.disabled = !e.target.value.trim();
  });

  elements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // BotÃ³n de enviar
  elements.sendBtn.addEventListener("click", sendMessage);

  // BotÃ³n de volver (mÃ³vil)
  elements.btnBack.addEventListener("click", closeActiveChat);

  // BÃºsqueda de contactos
  elements.searchContacts.addEventListener("input", (e) => {
    searchContacts(e.target.value.toLowerCase());
  });

  // Botones del header
  elements.viewProfileBtn.addEventListener("click", () => {
    if (currentRecipient && currentUser) {
      const accountType = currentRecipient.accountType || "contractor";
      const profilePage =
        accountType === "professional"
          ? "profile-professional.html"
          : "profile-contractor.html";
      const isOwnProfile = currentRecipient.userId === currentUser.uid;
      const viewingParam = isOwnProfile ? "own" : "other";
      window.location.href = `${profilePage}?user=${currentRecipient.userId}&viewing=${viewingParam}`;
    }
  });

  elements.projectInfoBtn.addEventListener("click", showProjectPanel);
  elements.closePanelBtn.addEventListener("click", closeProjectPanel);

  elements.viewProjectBtn.addEventListener("click", () => {
    if (currentProject) {
      window.location.href = `project-detail.html?id=${currentProject.id}`;
    }
  });

  elements.generateComputoBtn.addEventListener("click", () => {
    if (currentProject) {
      window.location.href = `tax-calculator.html?id=${currentRecipient.userId}&project=${currentProject.id}&professional=${currentUser.uid}`;
    }
  });

  // Eliminar chat
  elements.deleteChatBtn.addEventListener("click", deleteChat);

  // Adjuntar archivo (funcionalidad futura)
  elements.attachmentBtn.addEventListener("click", () => {
    showError("Funcionalidad de archivos prÃ³ximamente");
  });

  // Responsive: volver a la lista en mÃ³vil al hacer resize
  window.addEventListener("resize", () => {
    if (
      window.innerWidth > 768 &&
      elements.activeChat.style.display === "none"
    ) {
      // En desktop, mostrar siempre el chat si hay uno activo
      if (activeChat) {
        elements.activeChat.style.display = "flex";
      }
    }
  });
}

// ============================================================================
// CLEANUP AL SALIR
// ============================================================================
window.addEventListener("beforeunload", () => {
  updateUserStatus(false);
  cleanupActiveChat();

  if (contactsListener) {
    const userChatsRef = ref(rtdb, `userChats/${currentUser?.uid}`);
    off(userChatsRef);
  }
});

// ============================================================================
// EXPORTAR FUNCIONES (si es necesario)
// ============================================================================
export {
  initiateDirectChat,
  initiateChatWithProject,
  openChat,
  closeActiveChat,
  sendMessage,
};
