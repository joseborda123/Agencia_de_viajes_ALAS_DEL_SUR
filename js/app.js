const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ESTADOS = ['Pendiente','Confirmada','Completada','Cancelada'];
const E = {
  cliente: { pk:'id_cliente', title:'Clientes', one:'cliente', label:r=>`${r.nombre} ${r.apellido}`, fields:[
    {k:'nombre',l:'Nombre',req:1},{k:'apellido',l:'Apellido',req:1},{k:'telefono',l:'Teléfono'},
    {k:'tipo_documento',l:'Tipo de documento',type:'select',opts:['DNI','Pasaporte','Carné de extranjería','RUC'],req:1},
    {k:'numero_documento',l:'N.º de documento',req:1}]},
  destino: { pk:'id_destino', title:'Destinos', one:'destino', label:r=>`${r.ciudad}, ${r.pais}`, fields:[
    {k:'pais',l:'País',req:1},{k:'region',l:'Región'},{k:'ciudad',l:'Ciudad',req:1},
    {k:'descripcion',l:'Descripción',type:'textarea',long:1}]},
  paquetes: { pk:'id_paquete', title:'Paquetes', one:'paquete', label:r=>r.nombre_paquete, fields:[
    {k:'nombre_paquete',l:'Nombre del paquete',req:1},{k:'precio',l:'Precio',type:'number',step:'0.01',req:1,money:1},
    {k:'duracion_dias',l:'Duración (días)',type:'number',step:'1',req:1},
    {k:'id_destino',l:'Destino',fk:'destino'}]},
  reservas: { pk:'id_reserva', title:'Reservas', one:'reserva', label:r=>`#${r.id_reserva}`, fields:[
    {k:'fecha_reserva',l:'Fecha de reserva',type:'date',req:1},
    {k:'estado',l:'Estado',type:'select',opts:ESTADOS,req:1,tag:1},
    {k:'id_cliente',l:'Cliente',fk:'cliente',req:1},{k:'id_paquete',l:'Paquete',fk:'paquetes',req:1}]}
};

const $ = id => document.getElementById(id);
const data = {}; let cur = 'reservas'; let editing = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toast(msg, err){ const t=$('toast'); t.textContent=msg; t.className=err?'err':''; t.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(()=>t.style.display='none',3800); }

function cell(r, f){
  const v = r[f.k];
  if (v === null || v === undefined || v === '') return '<span style="color:var(--mute)">—</span>';
  if (f.fk){ const x = data[f.fk].find(o => o[E[f.fk].pk] === v); return esc(x ? E[f.fk].label(x) : v); }
  if (f.money) return 'S/ ' + Number(v).toLocaleString('es-PE',{minimumFractionDigits:2});
  if (f.tag) return `<span class="tag ${esc(v)}">${esc(v)}</span>`;
  return esc(v);
}
const plain = (r, f) => { const h = document.createElement('div'); h.innerHTML = cell(r,f); return h.textContent; };

function render(){
  const cfg = E[cur];
  $('title').textContent = cfg.title;
  $('add').textContent = 'Nuevo ' + cfg.one;
  $('nav').innerHTML = Object.keys(E).map(k => `<button class="nav ${k===cur?'on':''}" data-k="${k}">${E[k].title}<span>${(data[k]||[]).length}</span></button>`).join('');
  $('thead').innerHTML = '<tr><th>ID</th>' + cfg.fields.filter(f=>!f.long).map(f=>`<th>${f.l}</th>`).join('') + '<th></th></tr>';
  const q = $('q').value.trim().toLowerCase();
  const rows = (data[cur]||[]).filter(r => !q || cfg.fields.some(f => plain(r,f).toLowerCase().includes(q)));
  $('tbody').innerHTML = rows.map(r => `<tr><td>${r[cfg.pk]}</td>` + cfg.fields.filter(f=>!f.long).map(f=>`<td>${cell(r,f)}</td>`).join('') +
    `<td class="act"><button class="b g" data-e="${r[cfg.pk]}">Editar</button><button class="b g d" data-d="${r[cfg.pk]}">Eliminar</button></td></tr>`).join('');
  $('empty').hidden = rows.length > 0;
  $('empty').textContent = q ? 'Ningún resultado para esa búsqueda.' : `Aún no hay ${cfg.title.toLowerCase()}. Usa “Nuevo ${cfg.one}” para agregar el primero.`;
}

async function loadAll(){
  const res = await Promise.all(Object.keys(E).map(k => sb.from(k).select('*').order(E[k].pk)));
  Object.keys(E).forEach((k,i) => {
    if (res[i].error) toast(`No se pudo leer “${k}”: ${res[i].error.message}`, true);
    data[k] = res[i].data || [];
  });
  render();
}

function openForm(id){
  const cfg = E[cur]; editing = id;
  const r = id != null ? data[cur].find(x => x[cfg.pk] === id) : {};
  $('frm').innerHTML = `<h2>${id!=null?'Editar':'Nuevo'} ${cfg.one}</h2>` + cfg.fields.map(f => {
    const v = r[f.k] ?? (f.k==='fecha_reserva' ? new Date().toISOString().slice(0,10) : '');
    const a = `id="f_${f.k}" name="${f.k}" ${f.req?'required':''}`;
    let inp;
    if (f.fk) inp = `<select ${a}><option value="">— Seleccionar —</option>${data[f.fk].map(o=>`<option value="${o[E[f.fk].pk]}" ${o[E[f.fk].pk]===v?'selected':''}>${esc(E[f.fk].label(o))}</option>`).join('')}</select>`;
    else if (f.type==='select') inp = `<select ${a}><option value="">— Seleccionar —</option>${f.opts.map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select>`;
    else if (f.type==='textarea') inp = `<textarea ${a} rows="3">${esc(v)}</textarea>`;
    else inp = `<input ${a} type="${f.type||'text'}" ${f.step?`step="${f.step}" min="0"`:''} value="${esc(v)}">`;
    return `<label for="f_${f.k}">${f.l}${f.req?' *':''}</label>${inp}`;
  }).join('') + `<div class="row"><button type="button" class="b g" id="cancel">Cancelar</button><button class="b" type="submit">Guardar cambios</button></div>`;
  $('dlg').showModal();
}

$('frm').addEventListener('submit', async e => {
  e.preventDefault();
  const cfg = E[cur], body = {};
  cfg.fields.forEach(f => {
    let v = $('f_'+f.k).value.trim();
    if (v === '') v = null;
    else if (f.type==='number') v = Number(v);
    else if (f.fk) v = Number(v);
    body[f.k] = v;
  });
  const q = editing != null ? sb.from(cur).update(body).eq(cfg.pk, editing) : sb.from(cur).insert(body);
  const { error } = await q;
  if (error) return toast('No se pudo guardar: ' + error.message, true);
  $('dlg').close(); toast(editing != null ? 'Cambios guardados' : 'Registro creado'); loadAll();
});

document.addEventListener('click', async e => {
  const t = e.target;
  if (t.dataset.k){ cur = t.dataset.k; $('q').value=''; render(); }
  else if (t.dataset.e) openForm(Number(t.dataset.e));
  else if (t.dataset.d){
    if (!confirm(`¿Eliminar este ${E[cur].one}? Esta acción no se puede deshacer.`)) return;
    const { error } = await sb.from(cur).delete().eq(E[cur].pk, Number(t.dataset.d));
    if (error) return toast('No se pudo eliminar (¿tiene registros relacionados?): ' + error.message, true);
    toast('Registro eliminado'); loadAll();
  }
  else if (t.id === 'cancel') $('dlg').close();
});
$('add').onclick = () => openForm(null);
$('q').oninput = render;

if (SUPABASE_URL.includes('TU-PROYECTO')) { $('setup').style.display='block'; Object.keys(E).forEach(k=>data[k]=[]); render(); }
else loadAll();
