const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => 'S/ ' + Number(n).toLocaleString('es-PE', {minimumFractionDigits: 2});
let destinos = [], paquetes = [];

function showError(text){ const m = $('msg'); m.textContent = text; m.hidden = !text; }

function resumen(){
  const d = destinos.find(x => String(x.id_destino) === $('destino').value);
  const p = paquetes.find(x => String(x.id_paquete) === $('paquete').value);
  $('t-dest').textContent = d ? `${d.ciudad}, ${d.pais}` : 'Elige un destino';
  $('t-desc').textContent = d ? (d.descripcion || d.region || '') : 'Aquí verás el resumen de tu viaje.';
  $('t-paq').textContent = p ? p.nombre_paquete : '—';
  $('t-dur').textContent = p ? `${p.duracion_dias} días` : '—';
  $('t-pre').textContent = p ? money(p.precio) : '—';
}

function cargarPaquetes(){
  const id = $('destino').value, sel = $('paquete');
  const lista = paquetes.filter(p => String(p.id_destino) === id);
  sel.disabled = !id;
  sel.innerHTML = id
    ? '<option value="">— Seleccionar paquete —</option>' + lista.map(p => `<option value="${p.id_paquete}">${esc(p.nombre_paquete)} · ${p.duracion_dias} días · ${money(p.precio)}</option>`).join('')
    : '<option value="">Primero elige un destino</option>';
  resumen();
}

async function init(){
  if (SUPABASE_URL.includes('TU-PROYECTO')) { $('setup').hidden = false; $('destino').innerHTML = '<option value="">Sin conexión</option>'; return; }
  const [d, p] = await Promise.all([
    sb.from('destino').select('*').order('pais').order('ciudad'),
    sb.from('paquetes').select('*').order('nombre_paquete')
  ]);
  if (d.error || p.error) return showError('No se pudieron cargar los destinos: ' + (d.error || p.error).message);
  paquetes = p.data;
  destinos = d.data.filter(x => paquetes.some(q => q.id_destino === x.id_destino)); // solo destinos con paquetes
  $('destino').innerHTML = destinos.length
    ? '<option value="">— Seleccionar destino —</option>' + destinos.map(x => `<option value="${x.id_destino}">${esc(x.ciudad)}, ${esc(x.pais)}</option>`).join('')
    : '<option value="">No hay destinos con paquetes disponibles</option>';
}

$('destino').addEventListener('change', cargarPaquetes);
$('paquete').addEventListener('change', resumen);

$('frm').addEventListener('submit', async e => {
  e.preventDefault(); showError('');
  const btn = $('send'); btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    const tipo = $('tipo_documento').value, num = $('numero_documento').value.trim();
    // 1) Buscar al cliente por documento; si no existe, crearlo
    const found = await sb.from('cliente').select('id_cliente').eq('tipo_documento', tipo).eq('numero_documento', num).limit(1);
    if (found.error) throw found.error;
    let idCliente;
    if (found.data.length) idCliente = found.data[0].id_cliente;
    else {
      const nuevo = await sb.from('cliente').insert({
        nombre: $('nombre').value.trim(), apellido: $('apellido').value.trim(),
        telefono: $('telefono').value.trim() || null, tipo_documento: tipo, numero_documento: num
      }).select('id_cliente').single();
      if (nuevo.error) throw nuevo.error;
      idCliente = nuevo.data.id_cliente;
    }
    // 2) Crear la reserva en estado Pendiente
    const hoy = new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local
    const res = await sb.from('reservas').insert({
      fecha_reserva: hoy, estado: 'Pendiente', id_cliente: idCliente, id_paquete: Number($('paquete').value)
    }).select('id_reserva').single();
    if (res.error) throw res.error;
    $('ok-id').textContent = '#' + res.data.id_reserva;
    $('main-grid').hidden = true; $('ok').hidden = false; window.scrollTo(0, 0);
  } catch (err) {
    showError('No se pudo registrar la reserva: ' + err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Reservar';
  }
});

$('again').addEventListener('click', () => {
  $('frm').reset(); cargarPaquetes(); $('ok').hidden = true; $('main-grid').hidden = false;
});

init();
