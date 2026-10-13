const MAX_BYTES = 10 * 1024 * 1024;

const fileInput = document.getElementById("file");
const dropzone = document.getElementById("dropzone");
const preview = document.getElementById("preview");
const dropText = document.getElementById("dropText");
const styleList = document.getElementById("styleList");
const instructions = document.getElementById("instructions");
const generateBtn = document.getElementById("generate");
const statusEl = document.getElementById("status");
const resultSection = document.getElementById("resultSection");
const resultImg = document.getElementById("result");
const downloadLink = document.getElementById("download");

let selectedFile = null;

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", isError);
}

async function loadStyles() {
  const res = await fetch("/api/styles");
  const styles = await res.json();
  styleList.innerHTML = "";
  styles.forEach((s, i) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "style";
    input.value = s.id;
    input.checked = i === 0;
    label.append(input, document.createTextNode(s.label));
    styleList.append(label);
  });
}

function handleFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    setStatus("Format non supporté (PNG, JPEG ou WebP).", true);
    return;
  }
  if (file.size > MAX_BYTES) {
    setStatus("Image trop lourde (10 Mo max).", true);
    return;
  }
  selectedFile = file;
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  dropText.hidden = true;
  generateBtn.disabled = false;
  setStatus("");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));

["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("drag");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag");
  })
);
dropzone.addEventListener("drop", (e) => handleFile(e.dataTransfer.files[0]));

generateBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  generateBtn.disabled = true;
  setStatus("Génération en cours… (10 à 30 secondes)");
  resultSection.hidden = true;

  try {
    const style = document.querySelector('input[name="style"]:checked')?.value;
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: await fileToBase64(selectedFile),
        mimeType: selectedFile.type,
        style,
        instructions: instructions.value.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur inconnue");

    const url = `data:${data.mimeType};base64,${data.imageBase64}`;
    resultImg.src = url;
    downloadLink.href = url;
    resultSection.hidden = false;
    setStatus("Terminé.");
    resultSection.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    generateBtn.disabled = false;
  }
});

loadStyles().catch(() => setStatus("Impossible de charger les styles.", true));
