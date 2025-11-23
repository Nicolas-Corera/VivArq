import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  setDoc,
  doc,
  getDoc,
  GoogleAuthProvider,
  signInWithPopup,
} from "./firebase-config.js";
import { displayMessage } from "./displayMessage.js";

// Variables globales para datos de Google
let googleUserData = null;
let isGoogleRegistration = false;

const isRegistrationPage = document.getElementById("contractor") !== null;
const isLoginPage = document.getElementById("submitLogin") !== null;

function handleLoginButtonState() {
  const submitLogin = document.getElementById("submitLogin");
  const emailLogin = document.getElementById("emailLogin");
  const passwordLogin = document.getElementById("passwordLogin");
  if (submitLogin && emailLogin && passwordLogin) {
    submitLogin.disabled = !(
      emailLogin.value.trim() && passwordLogin.value.trim()
    );
  }
}

function showSuccessLogin() {
  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");
  const successSection = document.getElementById("successLoginSection");
  if (loginSection) loginSection.classList.remove("show");
  if (registerSection) registerSection.classList.remove("show");
  if (successSection) {
    successSection.classList.add("show");
  }
}

function handleRegisterButtonState() {
  const submitRegister = document.getElementById("submit");
  if (!submitRegister) return;

  // Si es registro con Google, no incluir contraseña en campos requeridos
  const requiredFields = [
    document.getElementById("name_surname"),
    document.getElementById("email"),
    isGoogleRegistration ? null : document.getElementById("password"),
    document.getElementById("documentNumber"),
    document.getElementById("phoneNumber"),
    document.getElementById("termsAgree"),
    document.getElementById("privacity"),
  ].filter((field) => field !== null);
  const professionalCheckbox = document.getElementById("professional");
  if (professionalCheckbox && professionalCheckbox.checked) {
    requiredFields.push(
      document.getElementById("profession"),
      document.getElementById("experience"),
      document.getElementById("location")
    );
  }
  const professionSelect = document.getElementById("profession");
  const locationSelect = document.getElementById("location");
  if (professionSelect && professionSelect.value === "Otro") {
    requiredFields.push(document.getElementById("otraProfesion"));
  }
  if (locationSelect && locationSelect.value === "Otra provincia") {
    requiredFields.push(document.getElementById("otherLocation"));
  }
  const accountTypeSelected =
    (document.getElementById("contractor") &&
      document.getElementById("contractor").checked) ||
    (document.getElementById("professional") &&
      document.getElementById("professional").checked);
  let allValid = requiredFields.every((field) => {
    if (!field) return true;
    if (field.type === "checkbox") return field.checked;
    return field.value && field.value.trim() !== "";
  });
  allValid = allValid && accountTypeSelected;
  submitRegister.disabled = !allValid;
}

// Función para verificar si existe una cuenta con ese email
async function checkExistingAccount(email) {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error("Error al verificar cuenta:", error);
    return false;
  }
}

// Función para actualizar el estado del botón de Google en registro
function updateGoogleButtonState() {
  const googleButton = document.querySelector(
    "#registerGoogleContainer .btn-google"
  );
  if (!googleButton) return;

  if (isGoogleRegistration && googleUserData) {
    // Deshabilitar botón si hay datos autocompletados de Google
    googleButton.disabled = true;
  } else {
    // Habilitar botón si no hay datos autocompletados
    googleButton.disabled = false;
  }
}

// Función para mostrar el formulario de registro con datos de Google
function showGoogleRegistrationForm(googleData) {
  const registerTab = document.getElementById("registerTab");
  const loginTab = document.getElementById("loginTab");
  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");

  // Cambiar a la pestaña de registro
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerSection.classList.add("show");
  loginSection.classList.remove("show");

  // Prellenar campos
  const nameField = document.getElementById("name_surname");
  const emailField = document.getElementById("email");
  const passwordField = document.getElementById("password");
  const passwordContainer = passwordField
    ? passwordField.parentElement.parentElement
    : null;

  if (nameField) {
    nameField.value = googleData.displayName || "";
    nameField.disabled = true;
  }
  if (emailField) {
    emailField.value = googleData.email || "";
    emailField.disabled = true;
  }
  if (passwordContainer) {
    // Crear mensaje informativo en lugar del campo de contraseña
    const googleAuthMessage = document.createElement("div");
    googleAuthMessage.id = "googleAuthMessage";
    googleAuthMessage.className = "input-group google-auth-info";
    googleAuthMessage.innerHTML = `
      <div style="background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 5px; padding: 12px 15px; margin-bottom: 20px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <i class="fas fa-lock-open" style="color: #2196f3; margin-top: 2px; flex-shrink: 0;"></i>
          <div>
            <p style="margin: 0 0 5px 0; font-weight: 500; color: #1976d2;">Registro con Google</p>
            <p style="margin: 0; font-size: 13px; color: #555;">Como te registras con Google, no necesitas una contraseña. Puedes crear tu cuenta directamente.</p>
          </div>
        </div>
      </div>
    `;
    passwordContainer.style.display = "none";
    passwordContainer.parentElement.insertBefore(
      googleAuthMessage,
      passwordContainer
    );
  }

  // Mostrar mensaje informativo
  displayMessage(
    "Complete los campos restantes para finalizar el registro con Google",
    "info"
  );

  isGoogleRegistration = true;
  googleUserData = googleData;

  // Deshabilitar botón de Google en el formulario de registro
  updateGoogleButtonState();
}

// Función para completar el login con éxito
async function completeSuccessfulLogin(user) {
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userInfo = userData.userInfo;
      const accountType = userInfo
        ? userInfo["5_Tipo de Cuenta"]
        : "contractor";
      localStorage.setItem("userRole", accountType);
      console.log("Tipo de cuenta guardado en localStorage:", accountType);
    } else {
      console.warn(
        "Documento de usuario no encontrado, usando rol predeterminado."
      );
      localStorage.setItem("userRole", "contractor");
    }
  } catch (error) {
    console.error("Error al obtener rol del usuario:", error);
    localStorage.setItem("userRole", "contractor");
  }

  const authContainer = document.getElementById("auth-container");
  authContainer.innerHTML = `
    <div id="successLoginSection" class="auth-section success-login-section">
      <div class="success-icon">
        <i class="fas fa-check"></i>
      </div>
      <h2 class="success-title">¡Sesión Iniciada con Éxito!</h2>
      <p class="success-message-section">Bienvenido nuevamente a VivArq</p>
      <div class="redirect-info">
        <p>
          Aguarda mientras te redirigimos<span class="loading-dots"
            ><span></span><span></span><span></span
          ></span>
        </p>
      </div>
    </div>
    `;
  showSuccessLogin();

  localStorage.setItem("logguedInUserId", user.uid);
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPage = urlParams.get("redirect");
  const userParam = urlParams.get("user");
  const viewingParam = urlParams.get("viewing");

  setTimeout(() => {
    if (redirectPage) {
      let redirectUrl = redirectPage;
      const params = new URLSearchParams();
      if (userParam) params.append("user", userParam);
      if (viewingParam) params.append("viewing", viewingParam);
      if (params.toString()) {
        redirectUrl += `?${params.toString()}`;
      }
      window.location.href = redirectUrl;
    } else {
      window.location.href = "index.html";
    }
  }, 4000);
}

// Función para manejar el login con Google
async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Verificar si el usuario ya tiene documento en Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      // Usuario existe, hacer login
      await completeSuccessfulLogin(user);
    } else {
      // Usuario no existe, debe completar registro
      const googleData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      // Cerrar sesión temporal para que complete el registro
      await auth.signOut();

      // Mostrar formulario de registro con datos prellenados
      showGoogleRegistrationForm(googleData);
    }
  } catch (error) {
    console.error("Error con Google Sign In:", error);
    const errorMessages = {
      "auth/popup-closed-by-user": "Cerraste la ventana de Google",
      "auth/cancelled-popup-request": "Operación cancelada",
      "auth/popup-blocked":
        "Ventana emergente bloqueada. Habilita las ventanas emergentes.",
      "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
    };
    const message =
      errorMessages[error.code] || "Error al iniciar sesión con Google";
    displayMessage(message, "error");
  }
}

// Agregar botones de Google al HTML
if (isLoginPage) {
  document.addEventListener("DOMContentLoaded", () => {
    const loginGoogleContainer = document.getElementById(
      "loginGoogleContainer"
    );
    if (loginGoogleContainer) {
      const googleButton = document.createElement("button");
      googleButton.type = "button";
      googleButton.className = "btn btn-social btn-google btn-block";
      googleButton.innerHTML =
        '<i class="fab fa-google"></i> Continuar con Google';
      googleButton.addEventListener("click", handleGoogleSignIn);

      loginGoogleContainer.appendChild(googleButton);
    }
  });
}

if (isRegistrationPage) {
  document.addEventListener("DOMContentLoaded", () => {
    const registerGoogleContainer = document.getElementById(
      "registerGoogleContainer"
    );
    if (registerGoogleContainer) {
      const googleButton = document.createElement("button");
      googleButton.type = "button";
      googleButton.className = "btn btn-social btn-google btn-block";
      googleButton.innerHTML =
        '<i class="fab fa-google"></i> Registrarse con Google';
      googleButton.addEventListener("click", handleGoogleSignIn);

      registerGoogleContainer.appendChild(googleButton);
    }
  });
}

if (isRegistrationPage) {
  let selectedAccountType = null;
  const contractorCheckbox = document.getElementById("contractor");
  const professionalCheckbox = document.getElementById("professional");
  const contractorLabel = document.querySelector('label[for="contractor"]');
  const professionalLabel = document.querySelector('label[for="professional"]');
  const professionalFields = document.getElementById("professionalFields");
  const contractorFields = document.getElementById("contractorFields");
  const allInputFields = document.querySelectorAll("input, select");
  allInputFields.forEach((field) => {
    const eventType = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventType, handleRegisterButtonState);
  });
  const termsCheckbox = document.getElementById("termsAgree");
  const privacityCheckbox = document.getElementById("privacity");
  if (termsCheckbox) {
    termsCheckbox.addEventListener("change", handleRegisterButtonState);
  }
  if (privacityCheckbox) {
    privacityCheckbox.addEventListener("change", handleRegisterButtonState);
  }
  function toggleAdditionalFields() {
    if (professionalCheckbox.checked) {
      professionalFields.style.display = "block";
      contractorFields.style.display = "block";
    } else if (contractorCheckbox.checked) {
      professionalFields.style.display = "none";
      contractorFields.style.display = "none";
    } else {
      professionalFields.style.display = "none";
      contractorFields.style.display = "none";
    }
    handleRegisterButtonState();
  }
  const professionSelect = document.getElementById("profession");
  const otraProfesionContainer = document.getElementById(
    "otraProfesionContainer"
  );
  function toggleOtraProfesion() {
    if (professionSelect.value === "Otro") {
      otraProfesionContainer.style.display = "block";
    } else {
      otraProfesionContainer.style.display = "none";
    }
    handleRegisterButtonState();
  }
  professionSelect?.addEventListener("change", toggleOtraProfesion);
  toggleOtraProfesion?.();
  const locationSelect = document.getElementById("location");
  const otraLocacion = document.getElementById("otherLocationContainer");
  function toggleOtraLocation() {
    if (locationSelect.value === "Otra provincia") {
      otraLocacion.style.display = "block";
    } else {
      otraLocacion.style.display = "none";
    }
    handleRegisterButtonState();
  }
  locationSelect?.addEventListener("change", toggleOtraLocation);
  toggleOtraLocation?.();
  function selectAccountType(event) {
    if (event.target.checked) {
      event.target.closest("label").classList.add("active");
      if (event.target.id === "contractor") {
        professionalCheckbox.checked = false;
        professionalLabel.classList.remove("active");
        selectedAccountType = "contractor";
      } else {
        contractorCheckbox.checked = false;
        contractorLabel.classList.remove("active");
        selectedAccountType = "professional";
      }
    }
    toggleAdditionalFields();
    console.log("Tipo de cuenta seleccionado:", selectedAccountType);
    handleRegisterButtonState();
  }
  contractorCheckbox?.addEventListener("change", selectAccountType);
  professionalCheckbox?.addEventListener("change", selectAccountType);
  handleRegisterButtonState();

  const submit = document.getElementById("submit");
  submit?.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = isGoogleRegistration
      ? null
      : document.getElementById("password").value.trim();
    const name_surname = document.getElementById("name_surname").value.trim();
    const documentNumber = document
      .getElementById("documentNumber")
      .value.trim();
    const location = document.getElementById("location").value.trim();
    const profession = document.getElementById("profession")?.value.trim();
    const otherProfesion = document
      .getElementById("otraProfesion")
      ?.value.trim();
    const otherLocation = document
      .getElementById("otherLocation")
      ?.value.trim();
    const experience = document.getElementById("experience")?.value.trim();
    const companyName = document.getElementById("companyName")?.value.trim();
    const termsAgree = document.getElementById("termsAgree").checked;
    const privacity = document.getElementById("privacity").checked;
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    if (submit) {
      submit.disabled = true;
      submit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    }
    if (
      !email ||
      (!isGoogleRegistration && !password) ||
      !name_surname ||
      !documentNumber ||
      !selectedAccountType ||
      !location ||
      !phoneNumber
    ) {
      displayMessage("¡Completa todos los campos!", "error");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }
    if (!termsAgree) {
      displayMessage("Debes aceptar los Términos y Condiciones", "error");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }
    if (!privacity) {
      displayMessage("Debes aceptar la Política de Privacidad", "error");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }
    if (!validateEmail(email)) {
      displayMessage("Correo electrónico no válido", "error");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }
    if (!isGoogleRegistration && !validatePassword(password)) {
      displayMessage(
        "La contraseña debe tener entre 8 y 16 caracteres, incluir mayúsculas, minúsculas, números y símbolos.",
        "error"
      );
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }
    if (!location) {
      displayMessage("¡Selecciona una ubicación!", "error");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }
    if (profession === "Otro" && !otherProfesion) {
      displayMessage("¡Especifica tu profesión!", "error");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }
    if (location === "Otra provincia" && !otherLocation) {
      displayMessage("¡Especifica tu provincia!", "error");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
      return;
    }

    try {
      let user;

      if (isGoogleRegistration && googleUserData) {
        // Registro con Google - iniciar sesión con credenciales de Google
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      } else {
        // Registro normal con email y contraseña
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        if (signInMethods.length > 0) {
          displayMessage(
            "¡El correo electrónico ingresado ya está en uso!",
            "error"
          );
          if (submit) {
            submit.disabled = false;
            submit.textContent = "Crear Cuenta";
          }
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        user = userCredential.user;
      }

      const creationDate = new Date();
      const formattedDate = creationDate.toLocaleString("es-LA");
      const userData = {
        userInfo: {
          "1_Email": email,
          "2_Nombre y Apellido": name_surname,
          "3_Número de Documento": documentNumber,
          "4_Fecha de Creación": formattedDate,
          "5_Tipo de Cuenta": selectedAccountType,
          "6_Ubicación":
            location === "Otra provincia" ? otherLocation : location,
          "7_Profesión": profession === "Otro" ? otherProfesion : profession,
          "8_Años de Experiencia": experience,
          "9_Nombre de la Empresa": companyName,
          "10_Términos y condiciones": termsAgree,
          "10.1_Política de Privacidad": privacity,
          "11_Contraseña": password || "Google Auth",
          "12_Número de Teléfono": phoneNumber,
          "13_Foto de Perfil":
            isGoogleRegistration && googleUserData
              ? googleUserData.photoURL
              : null,
          "14_Método de Autenticación": isGoogleRegistration
            ? "Google"
            : "Email",
        },
      };

      console.log("Profesión:", profession);
      console.log("Años de experiencia:", experience);
      console.log("Nombre de la empresa:", companyName);
      console.log("Tipo de cuenta:", selectedAccountType);

      await setDoc(doc(db, "users", user.uid), userData);
      localStorage.setItem("logguedInUserId", user.uid);
      localStorage.setItem("userRole", selectedAccountType);

      const authContainer = document.getElementById("auth-container");
      authContainer.innerHTML = `
    <div id="successLoginSection" class="auth-section success-login-section">
      <div class="success-icon">
        <i class="fas fa-check"></i>
      </div>
      <h2 class="success-title">¡Cuenta Registrada con Éxito!</h2>
      <p class="success-message-section">Bienvenido a VivArq</p>
      <div class="redirect-info">
        <p>
          Aguarda mientras te redirigimos<span class="loading-dots"
            ><span></span><span></span><span></span
          ></span>
        </p>
      </div>
    </div>
    `;
      showSuccessLogin();

      const urlParams = new URLSearchParams(window.location.search);
      const redirectPage = urlParams.get("redirect");
      const userParam = urlParams.get("user");
      const viewingParam = urlParams.get("viewing");

      setTimeout(() => {
        if (redirectPage) {
          let redirectUrl = redirectPage;
          const params = new URLSearchParams();
          if (userParam) params.append("user", userParam);
          if (viewingParam) params.append("viewing", viewingParam);
          if (params.toString()) {
            redirectUrl += `?${params.toString()}`;
          }
          window.location.href = redirectUrl;
        } else {
          window.location.href = "index.html";
        }
      }, 4000);

      // Resetear el estado de Google
      isGoogleRegistration = false;
      googleUserData = null;
    } catch (error) {
      const errorCode = error.code;
      if (errorCode === "auth/email-already-in-use") {
        displayMessage("¡El correo electrónico ingresado ya existe!", "error");
      } else {
        displayMessage("¡Error al crear la cuenta!", "error");
        console.error("Error de registro:", error);
      }
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Crear Cuenta";
      }
    }
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
  return passwordPattern.test(password);
}

if (isLoginPage) {
  const submitLogin = document.getElementById("submitLogin");
  const emailLogin = document.getElementById("emailLogin");
  const passwordLogin = document.getElementById("passwordLogin");
  if (submitLogin && emailLogin && passwordLogin) {
    submitLogin.disabled = true;
    emailLogin.addEventListener("input", handleLoginButtonState);
    passwordLogin.addEventListener("input", handleLoginButtonState);
    handleLoginButtonState();
  }
}

const submitLogin = document.getElementById("submitLogin");
submitLogin?.addEventListener("click", async (event) => {
  event.preventDefault();
  const emailLogin = document.getElementById("emailLogin").value.trim();
  const passwordLogin = document.getElementById("passwordLogin").value.trim();
  if (submitLogin) {
    submitLogin.disabled = true;
    submitLogin.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Cargando...';
  }
  if (!emailLogin || !passwordLogin) {
    displayMessage("¡Completa todos los campos!", "error");
    if (submitLogin) {
      submitLogin.disabled = false;
      submitLogin.textContent = "Iniciar Sesión";
    }
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailLogin,
      passwordLogin
    );
    const user = userCredential.user;

    await completeSuccessfulLogin(user);
  } catch (error) {
    const errorCode = error.code;
    const loginErrorMessages = {
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/user-not-found": "Usuario no registrado",
      "auth/invalid-email": "Correo electrónico inválido",
      "auth/user-disabled": "La cuenta está deshabilitada",
      "auth/too-many-requests":
        "Demasiados intentos. Vuelve a intentarlo más tarde.",
      "auth/invalid-credential": "Datos incorrectos",
      "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
    };
    const message =
      loginErrorMessages[errorCode] || "¡Error al iniciar sesión!";
    displayMessage(message, "error");
    if (!loginErrorMessages[errorCode]) {
      console.error("Error inesperado:", error);
    }
    if (submitLogin) {
      submitLogin.disabled = false;
      submitLogin.textContent = "Iniciar Sesión";
    }
  }
});

const btnForgotPassword = document.getElementById("forgotPasswordLink");
const sendEmailButton = document.getElementById("sendEmailButton");
const emailResetInput = document.getElementById("emailReset");

if (btnForgotPassword) {
  btnForgotPassword.onclick = () => {
    window.location.href = "resetPassword.html";
  };
}

if (emailResetInput) {
  emailResetInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter" && sendEmailButton) {
      sendEmailButton.click();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const documentInput = document.getElementById("documentNumber");
  if (documentInput) {
    documentInput.type = "text";
    let numericValue = "";
    documentInput.addEventListener("input", function (e) {
      const cursorPos = e.target.selectionStart;
      const previousLength = e.target.value.length;
      numericValue = e.target.value.replace(/[^\d]/g, "");
      if (numericValue.length > 8) {
        numericValue = numericValue.slice(0, 8);
      }
      let formattedValue = "";
      for (let i = 0; i < numericValue.length; i++) {
        if (i === 2 || i === 5) {
          formattedValue += "." + numericValue[i];
        } else {
          formattedValue += numericValue[i];
        }
      }
      e.target.value = formattedValue;
      const lengthDiff = e.target.value.length - previousLength;
      const newCursorPos = cursorPos + (lengthDiff > 0 ? 1 : 0);
      if (lengthDiff >= 0 && (cursorPos === 2 || cursorPos === 6)) {
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
    const form = documentInput.closest("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        if (numericValue.length < 7 || numericValue.length > 8) {
          e.preventDefault();
          displayMessage("El DNI debe tener entre 7 y 8 dígitos", "error");
          return;
        }
        documentInput.value = numericValue;
      });
    }
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const phoneInput = document.getElementById("phoneNumber");
  if (phoneInput) {
    phoneInput.type = "text";
    let numericPhone = "";
    phoneInput.addEventListener("input", function (e) {
      const cursorPos = e.target.selectionStart;
      const previousLength = e.target.value.length;
      numericPhone = e.target.value.replace(/[^\d]/g, "");
      if (numericPhone.length > 10) {
        numericPhone = numericPhone.slice(0, 10);
      }
      let formattedPhone = "";
      for (let i = 0; i < numericPhone.length; i++) {
        if (i === 2) {
          formattedPhone += " " + numericPhone[i];
        } else if (i === 6) {
          formattedPhone += "-" + numericPhone[i];
        } else {
          formattedPhone += numericPhone[i];
        }
      }
      e.target.value = formattedPhone;
      const lengthDiff = e.target.value.length - previousLength;
      const newCursorPos = cursorPos + (lengthDiff > 0 ? 1 : 0);
      if (lengthDiff >= 0 && (cursorPos === 2 || cursorPos === 7)) {
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
    const form = phoneInput.closest("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        if (numericPhone.length !== 10) {
          e.preventDefault();
          displayMessage("El número debe tener 10 dígitos", "error");
          return;
        }
        phoneInput.value = numericPhone;
      });
    }
  }
});

// Manejar cambio de tabs en el formulario de registro
document.addEventListener("DOMContentLoaded", function () {
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");

  if (loginTab && registerTab) {
    loginTab.addEventListener("click", function () {
      // Al cambiar a login, resetear estado de Google y limpiar mensaje
      isGoogleRegistration = false;
      googleUserData = null;
      updateGoogleButtonState();
      removeGoogleAuthMessage();
    });

    registerTab.addEventListener("click", function () {
      // Al cambiar a registro, resetear estado de Google y limpiar mensaje
      isGoogleRegistration = false;
      googleUserData = null;
      updateGoogleButtonState();
      removeGoogleAuthMessage();
    });
  }
});

// Función para remover el mensaje de autenticación con Google
function removeGoogleAuthMessage() {
  const googleAuthMessage = document.getElementById("googleAuthMessage");
  if (googleAuthMessage) {
    googleAuthMessage.remove();
  }
  // Mostrar el campo de contraseña nuevamente
  const passwordField = document.getElementById("password");
  if (passwordField) {
    const passwordContainer = passwordField.parentElement.parentElement;
    if (passwordContainer) {
      passwordContainer.style.display = "block";
    }
  }
}
