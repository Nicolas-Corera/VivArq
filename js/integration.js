import {
  auth,
  db,
  doc,
  getDoc,
  GoogleAuthProvider,
  linkWithPopup,
  signOut,
} from "./firebase-config.js";
import { displayMessage } from "./displayMessage.js";
import { unlink } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Función para verificar si el usuario inició sesión con Google
function isGoogleUser(user) {
  if (!user) return false;
  return user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );
}

// Función para verificar si el usuario tiene email/password vinculado
function hasPasswordProvider(user) {
  if (!user) return false;
  return user.providerData.some(
    (provider) => provider.providerId === "password"
  );
}

// Función para verificar si el usuario se registró originalmente con Google
async function wasRegisteredWithGoogle(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.signInMethod === "google";
    }
    return false;
  } catch (error) {
    console.error("Error al verificar método de registro:", error);
    return false;
  }
}

// Cargar el estado de las integraciones
async function loadIntegrations() {
  const user = auth.currentUser;

  if (!user) {
    console.log("No hay usuario autenticado");
    return;
  }

  const integrationsContainer = document.getElementById("integrationsSection");

  if (!integrationsContainer) {
    console.log("No se encontró el contenedor de integraciones");
    return;
  }

  const isGoogle = isGoogleUser(user);
  const hasPassword = hasPasswordProvider(user);
  const registeredWithGoogle = await wasRegisteredWithGoogle(user.uid);

  // Buscar y remover solo el Google integration existente
  const existingGoogleIntegration =
    document.getElementById("googleIntegration");
  const existingGoogleCard = document.getElementById("googleIntegrationCard");

  if (existingGoogleIntegration) existingGoogleIntegration.remove();
  if (existingGoogleCard) existingGoogleCard.remove();

  // GARANTIZAR que existe el contenedor de integraciones disponibles
  let availableIntegrations = integrationsContainer.querySelector(
    ".available-integrations"
  );
  if (!availableIntegrations) {
    console.log("Creando contenedor de integraciones disponibles");
    const headerAvailable = document.createElement("div");
    headerAvailable.className = "settings-header";
    headerAvailable.innerHTML = `
      <h3>Integraciones Disponibles</h3>
      <p>Conéctate con otros servicios para mejorar tu experiencia</p>
    `;
    availableIntegrations = document.createElement("div");
    availableIntegrations.className = "available-integrations";
    availableIntegrations.id = "available-integrations";
    integrationsContainer.appendChild(headerAvailable);
    integrationsContainer.appendChild(availableIntegrations);
  }

  if (isGoogle) {
    // Usuario conectado con Google - agregar a "Integraciones Conectadas"
    let connectedList = integrationsContainer.querySelector(
      "#connected-integrations"
    );

    if (!connectedList) {
      const connectedHeader = document.createElement("div");
      connectedHeader.className = "settings-header";
      connectedHeader.innerHTML = `
        <h3>Integraciones Conectadas</h3>
        <p>Servicios que has conectado a tu cuenta</p>
      `;
      connectedList = document.createElement("div");
      connectedList.className = "integrations-list";
      connectedList.id = "connected-integrations";

      const firstChild = integrationsContainer.firstChild;
      if (firstChild) {
        integrationsContainer.insertBefore(connectedHeader, firstChild);
        integrationsContainer.insertBefore(
          connectedList,
          connectedHeader.nextSibling
        );
      } else {
        integrationsContainer.appendChild(connectedHeader);
        integrationsContainer.appendChild(connectedList);
      }
    }

    // REMOVER el mensaje de "No hay integraciones" SI EXISTE
    const noIntegMsg = connectedList.querySelector(".no-integrations");
    if (noIntegMsg) {
      noIntegMsg.remove();
    }

    // Determinar si puede desconectarse
    const canDisconnect = hasPassword && !registeredWithGoogle;

    const googleHTML = `
      <div class="integration-item" id="googleIntegration">
        <div class="integration-logo">
          <i class="fab fa-google"></i>
        </div>
        <div class="integration-info">
          <h4>Google</h4>
          <p>Conectado como método de autenticación</p>
          <p class="integration-permissions">Permisos: Acceso a perfil básico y email</p>
        </div>
        <div class="integration-actions">
          ${
            canDisconnect
              ? '<button class="btn btn-error btn-small" id="disconnectGoogleBtn">Desconectar</button>'
              : '<button class="btn btn-secondary btn-small" disabled>Conectado</button>'
          }
        </div>
      </div>
    `;

    connectedList.insertAdjacentHTML("beforeend", googleHTML);

    if (canDisconnect) {
      setTimeout(() => {
        const disconnectBtn = document.getElementById("disconnectGoogleBtn");
        if (disconnectBtn) {
          disconnectBtn.addEventListener("click", () => showDisconnectModal());
        }
      }, 100);
    }
  } else {
    // Usuario NO conectado con Google - agregar a "Integraciones Disponibles"
    const googleCardHTML = `
      <div class="integration-card" id="googleIntegrationCard">
        <div class="integration-icon">
          <i class="fab fa-google"></i>
        </div>
        <h4>Google</h4>
        <p>Conecta tu cuenta de Google para iniciar sesión</p>
        <button class="btn btn-primary" id="connectGoogleBtn">Conectar</button>
      </div>
    `;

    availableIntegrations.insertAdjacentHTML("afterbegin", googleCardHTML);

    setTimeout(() => {
      const connectBtn = document.getElementById("connectGoogleBtn");
      if (connectBtn) {
        connectBtn.addEventListener("click", connectGoogleAccount);
      }
    }, 100);
  }

  // SIEMPRE asegurar que LinkedIn está visible en integraciones disponibles
  ensureLinkedinVisible(availableIntegrations);
}

// Función para garantizar que LinkedIn siempre está visible
function ensureLinkedinVisible(availableIntegrations) {
  let linkedinCard = document.getElementById("linkedinCard");

  // Si LinkedIn existe, asegurarse que esté visible y en el contenedor correcto
  if (linkedinCard) {
    // Mostrar si está oculto
    linkedinCard.style.display = "block";

    // Si está en otro lugar, moverlo al contenedor de disponibles
    if (linkedinCard.parentElement !== availableIntegrations) {
      availableIntegrations.appendChild(linkedinCard);
    }

    // Asegurar que el botón tiene el event listener
    const connectLinkedinBtn = document.getElementById("connectLinkedinBtn");
    if (connectLinkedinBtn && !connectLinkedinBtn.hasListener) {
      connectLinkedinBtn.addEventListener("click", () => showLinkedinModal());
      connectLinkedinBtn.hasListener = true;
    }
  } else {
    // Si no existe, crearlo
    const linkedinCardHTML = `
      <div class="integration-card" data-integration-id="linkedin" id="linkedinCard">
        <div class="integration-icon">
          <i class="fab fa-linkedin-in"></i>
        </div>
        <h4>LinkedIn</h4>
        <p>Conecta tu cuenta de LinkedIn para compartir más información profesional</p>
        <button class="btn btn-primary connect-integration" id="connectLinkedinBtn">Conectar</button>
      </div>
    `;
    availableIntegrations.insertAdjacentHTML("beforeend", linkedinCardHTML);

    const connectLinkedinBtn = document.getElementById("connectLinkedinBtn");
    if (connectLinkedinBtn) {
      connectLinkedinBtn.addEventListener("click", () => showLinkedinModal());
      connectLinkedinBtn.hasListener = true;
    }
  }
}

function showLinkedinModal() {
  const modalLinkedinHTML = `
    <div id="connectLinkedinModal" class="modalDelete active">
      <div class="modal-contentDelete">
        <div class="modal-headerDelete">
          <h3><i class="fab fa-linkedin-in" style="color: blue;"></i><span style="color: black; font-weight: bold;">LinkedIn</span></h3>
          <span class="close-modalDelete" onclick="hideDisconnectLinkedinModal()">&times;</span>
        </div>
        <div class="modal-bodyDelete">
          <p>Actualmente esta función se encuentra en desarrollo</p>
          <p style="margin-top: 1rem; color: #718096; font-size: 0.9rem;">Se encontrá disponible en futuras actualizaciones.</p>
        </div>
      </div>
    </div>
  `;

  if (!document.getElementById("connectLinkedinModal")) {
    document.body.insertAdjacentHTML("beforeend", modalLinkedinHTML);
    document.body.style.overflow = "hidden";
  }
}

window.hideDisconnectLinkedinModal = function () {
  const modal = document.getElementById("connectLinkedinModal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "";
  }
};

// Función para conectar cuenta de Google
async function connectGoogleAccount() {
  const user = auth.currentUser;

  if (!user) {
    displayMessage("Error: No hay usuario autenticado", "error");
    return;
  }

  const connectBtn = document.getElementById("connectGoogleBtn");
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Conectando...';
  }

  try {
    const provider = new GoogleAuthProvider();
    await linkWithPopup(user, provider);

    displayMessage("Cuenta de Google vinculada exitosamente", "success");

    setTimeout(() => {
      loadIntegrations();
    }, 1000);
  } catch (error) {
    console.error("Error al vincular cuenta de Google:", error);

    let errorMessage = "Error al vincular cuenta de Google";

    if (error.code === "auth/provider-already-linked") {
      errorMessage = "Esta cuenta de Google ya está vinculada";
    } else if (error.code === "auth/credential-already-in-use") {
      errorMessage = "Esta cuenta de Google ya está en uso por otra cuenta";
    } else if (error.code === "auth/email-already-in-use") {
      errorMessage = "El email de esta cuenta de Google ya está en uso";
    }

    displayMessage(errorMessage, "error");

    if (connectBtn) {
      connectBtn.disabled = false;
      connectBtn.textContent = "Conectar";
    }
  }
}

// Función para mostrar modal de confirmación de desconexión
function showDisconnectModal() {
  const modalHTML = `
    <div id="disconnect-google-modal" class="modalDelete active">
      <div class="modal-contentDelete">
        <div class="modal-headerDelete">
          <h3><i class="fas fa-exclamation-triangle"></i> Desconectar Google</h3>
          <span class="close-modalDelete" onclick="hideDisconnectGoogleModal()">&times;</span>
        </div>
        <div class="modal-bodyDelete">
          <p>¿Estás seguro de que deseas desconectar tu cuenta de Google?</p>
          <p style="margin-top: 1rem; color: #718096; font-size: 0.9rem;">Podrás seguir iniciando sesión con tu email y contraseña.</p>
          <div class="modal-actionsDelete">
            <button type="button" class="btn btn-secondary" onclick="hideDisconnectGoogleModal()">Cancelar</button>
            <button type="button" id="confirm-disconnect-google" class="btn btn-error">Desconectar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  if (!document.getElementById("disconnect-google-modal")) {
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document.body.style.overflow = "hidden";

    const confirmBtn = document.getElementById("confirm-disconnect-google");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", disconnectGoogleAccount);
    }
  }
}

window.hideDisconnectGoogleModal = function () {
  const modal = document.getElementById("disconnect-google-modal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "";
  }
};

// Función para desconectar cuenta de Google
async function disconnectGoogleAccount() {
  const user = auth.currentUser;

  if (!user) {
    displayMessage("Error: No hay usuario autenticado", "error");
    return;
  }

  const confirmBtn = document.getElementById("confirm-disconnect-google");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Desconectando...';
  }

  try {
    const googleProvider = user.providerData.find(
      (provider) => provider.providerId === "google.com"
    );

    if (!googleProvider) {
      displayMessage("No se encontró la vinculación con Google", "error");
      return;
    }

    await unlink(user, "google.com");

    displayMessage("Cuenta de Google desconectada exitosamente", "success");

    hideDisconnectGoogleModal();
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error("Error al desvincular cuenta de Google:", error);

    let errorMessage = "Error al desconectar cuenta de Google";

    if (error.code === "auth/requires-recent-login") {
      errorMessage =
        "Por seguridad, debes iniciar sesión nuevamente antes de desconectar Google";
    }

    displayMessage(errorMessage, "error");

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Desconectar";
    }
  }
}

// Escuchar cambios en el estado de autenticación
auth.onAuthStateChanged((user) => {
  if (user) {
    setTimeout(() => {
      loadIntegrations();
    }, 500);
  }
});

// Cargar integraciones cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  if (auth.currentUser) {
    loadIntegrations();
  }
});
