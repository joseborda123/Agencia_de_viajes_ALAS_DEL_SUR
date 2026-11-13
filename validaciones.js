/* Reglas de validación compartidas por el panel (app.js) y la pantalla de reservas (reservar.js) */
const V = (() => {
  const hoy = () => new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD, hora local
  const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  const titulo = s => s.trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

  const DOCS = {
    'DNI':                  { re:/^\d{8}$/,              max:8,  num:true,  ph:'8 dígitos',          msg:'El DNI debe tener exactamente 8 dígitos numéricos.' },
    'RUC':                  { re:/^(10|15|17|20)\d{9}$/, max:11, num:true,  ph:'11 dígitos',         msg:'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.' },
    'Pasaporte':            { re:/^[A-Z0-9]{6,12}$/,     max:12, num:false, ph:'6 a 12 caracteres',  msg:'El pasaporte debe tener de 6 a 12 letras o números.' },
    'Carné de extranjería': { re:/^[A-Z0-9]{9,12}$/,     max:12, num:false, ph:'9 a 12 caracteres',  msg:'El carné de extranjería debe tener de 9 a 12 letras o números.' }
  };
  const ACTIVOS = ['Pendiente', 'Confirmada']; // estados que cuentan como reserva vigente

  /* Limpieza en vivo mientras se escribe */
  const limpiaTel = v => v.startsWith('-') ? '-' : v.replace(/\D/g, '').slice(0, 9);
  const limpiaLetras = v => v.replace(/[^\p{L}\s'.-]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, 40);
  const limpiaDoc = (v, tipo) => {
    const d = DOCS[tipo];
    const s = d && d.num ? v.replace(/\D/g, '') : v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return s.slice(0, d ? d.max : 12);
  };

  /* Validadores: devuelven '' si está bien, o el mensaje de error */
  const nombre = (v, et) => {
    if (v.length < 2) return `${et} debe tener al menos 2 letras.`;
    if (!/^\p{L}[\p{L}\s'.-]*$/u.test(v)) return `${et} solo puede contener letras.`;
    return '';
  };
  const telefono = v => /^(-|9\d{8})$/.test(v) ? '' : 'El celular debe tener 9 dígitos y empezar con 9 (o escribe "-" si no tienes).';
  const documento = (tipo, n) => !DOCS[tipo] ? 'Selecciona el tipo de documento.' : (DOCS[tipo].re.test(n) ? '' : DOCS[tipo].msg);

  /* Enlaces a los campos del formulario */
  const bindLetras = inp => inp.addEventListener('input', () => { inp.value = limpiaLetras(inp.value); });
  const bindTelefono = inp => {
    inp.inputMode = 'tel'; inp.maxLength = 9; inp.placeholder = '9XXXXXXXX o -';
    inp.addEventListener('input', () => { inp.value = limpiaTel(inp.value); });
  };
  const bindDocumento = (inp, sel) => {
    const aplicar = () => {
      const d = DOCS[sel.value];
      inp.maxLength = d ? d.max : 12; inp.inputMode = d && d.num ? 'numeric' : 'text';
      inp.placeholder = d ? d.ph : 'Elige primero el tipo';
      inp.value = limpiaDoc(inp.value, sel.value);
    };
    sel.addEventListener('change', aplicar);
    inp.addEventListener('input', () => { inp.value = limpiaDoc(inp.value, sel.value); });
    aplicar();
  };

  /* Muestra el error junto al campo (burbuja nativa) y devuelve false */
  const fallo = (inp, msg) => {
    inp.setCustomValidity(msg); inp.reportValidity();
    ['input', 'change'].forEach(ev => inp.addEventListener(ev, () => inp.setCustomValidity(''), { once: true }));
    return false;
  };

  return { hoy, norm, titulo, DOCS, ACTIVOS, limpiaTel, limpiaLetras, limpiaDoc, nombre, telefono, documento, bindLetras, bindTelefono, bindDocumento, fallo };
})();
