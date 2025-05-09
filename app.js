// ===== IMPORTS =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ===== CONFIGURACIÓN FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyDFXngEnba7wuSyU8HlGNWkQ911lCUgfRU",
  authDomain: "itam-vsgroup.firebaseapp.com",
  projectId: "itam-vsgroup",
  storageBucket: "itam-vsgroup.firebasestorage.app",
  messagingSenderId: "684764844921",
  appId: "1:684764844921:web:1ac10b78e8692b980a15a8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== VARIABLES GLOBALES =====
let scanner;
let ultimoTexto = "";
let tiempoUltimo = 0;

// ===== FUNCIONES DE ESCANEO =====
function agregarAFila(dato) {
  const tabla = document.querySelector("#history tbody");
  const fila = document.createElement("tr");
  const celda1 = document.createElement("td");
  const celda2 = document.createElement("td");
  celda1.textContent = dato;
  celda2.textContent = new Date().toLocaleString();
  fila.appendChild(celda1);
  fila.appendChild(celda2);
  tabla.prepend(fila);
}

function reproducirSonido() {
  const beep = document.getElementById("beep");
  beep.play();
}

function iniciarEscaneo() {
  document.getElementById("reader").style.display = "block";
  scanner = new Html5Qrcode("reader");
  const config = { fps: 10, qrbox: 250 };

  scanner.start(
    { facingMode: "environment" },
    config,
    async (decodedText, decodedResult) => {
      const ahora = Date.now();
      if (decodedText !== ultimoTexto || (ahora - tiempoUltimo) > 2000) {
        ultimoTexto = decodedText;
        tiempoUltimo = ahora;
        agregarAFila(decodedText);
        reproducirSonido();
        console.log("Escaneado:", decodedText);
        await buscarActivoPorId(decodedText); // <-- consulta en Firestore
      }
    },
    (errorMessage) => {
      console.warn("Error de escaneo:", errorMessage);
    }
  ).catch(err => console.error("Error al iniciar escáner", err));
}

function detenerEscaneo() {
  if (scanner) {
    scanner.stop().then(() => {
      document.getElementById("reader").style.display = "none";
      console.log("Escáner detenido");
    }).catch(err => console.error("Error al detener escáner", err));
  }
}

// ===== FIRESTORE =====
async function buscarActivoPorId(id) {
  console.log("Buscando en Firebase:", id);
  const ref = doc(db, "activos", id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const datos = snap.data();
    console.log("Activo encontrado:", datos);
    mostrarDatosEnFormulario(id, datos);
  } else {
    console.log("Activo NO encontrado");
    mostrarFormularioParaNuevoActivo(id);
  }
}

async function guardarActivo() {
  const id = document.getElementById("id").value;
  const datos = {
    tipo: document.getElementById("tipo").value,
    usuario: document.getElementById("usuario").value,
    area: document.getElementById("area").value,
    marca: document.getElementById("marca").value,
    fechaAsignacion: document.getElementById("fecha").value,
    serialNumber: document.getElementById("sn").value,
  };

  try {
    await setDoc(doc(db, "activos", id), datos);
    alert("✅ Activo guardado correctamente");
    document.getElementById("formulario").style.display = "none";
    console.log("Guardado en Firebase:", id, datos);
  } catch (e) {
    console.error("❌ Error al guardar:", e);
    alert("Error al guardar los datos");
  }
}

// ===== UI FORMULARIO =====
function mostrarDatosEnFormulario(id, datos) {
  document.getElementById("formulario").style.display = "block";
  document.getElementById("id").value = id;
  document.getElementById("tipo").value = datos.tipo || "";
  document.getElementById("usuario").value = datos.usuario || "";
  document.getElementById("area").value = datos.area || "";
  document.getElementById("marca").value = datos.marca || "";
  document.getElementById("fecha").value = datos.fechaAsignacion || "";
  document.getElementById("sn").value = datos.serialNumber || "";
}

function mostrarFormularioParaNuevoActivo(id) {
  document.getElementById("formulario").style.display = "block";
  document.getElementById("id").value = id;
  document.getElementById("tipo").value = "";
  document.getElementById("usuario").value = "";
  document.getElementById("area").value = "";
  document.getElementById("marca").value = "";
  document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
  document.getElementById("sn").value = "";
}

// ===== EXPORTAR FUNCIONES AL WINDOW PARA HTML =====
window.iniciarEscaneo = iniciarEscaneo;
window.detenerEscaneo = detenerEscaneo;
window.guardarActivo = guardarActivo;