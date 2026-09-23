const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  token: sessionStorage.getItem('securedocs_token'),
  usuario: null,
  documentos: [],
  usuarios: [],
  auditorias: [],
  context: JSON.parse(localStorage.getItem('securedocs_context') || '{"ubicacion":"PERU","dispositivo":"CORPORATIVO","hora":""}'),
};

const permisos = {
  ADMINISTRADOR: ['CREAR_DOCUMENTO','CONSULTAR_DOCUMENTO','MODIFICAR_DOCUMENTO','ELIMINAR_DOCUMENTO','APROBAR_DOCUMENTO','VER_AUDITORIA','GESTIONAR_USUARIOS','ASIGNAR_ROLES'],
  GERENTE: ['CREAR_DOCUMENTO','CONSULTAR_DOCUMENTO','MODIFICAR_DOCUMENTO','ELIMINAR_DOCUMENTO','APROBAR_DOCUMENTO','VER_AUDITORIA'],
  SUPERVISOR: ['CREAR_DOCUMENTO','CONSULTAR_DOCUMENTO','MODIFICAR_DOCUMENTO','APROBAR_DOCUMENTO'],
  EMPLEADO: ['CREAR_DOCUMENTO','CONSULTAR_DOCUMENTO','MODIFICAR_DOCUMENTO'],
  AUDITOR: ['CONSULTAR_DOCUMENTO','VER_AUDITORIA'],
  INVITADO: ['CONSULTAR_DOCUMENTO'],
};

const accionesMatriz = [
  ['Crear documento', 'CREAR_DOCUMENTO'], ['Consultar documento', 'CONSULTAR_DOCUMENTO'],
  ['Modificar documento', 'MODIFICAR_DOCUMENTO'], ['Eliminar documento', 'ELIMINAR_DOCUMENTO'],
  ['Aprobar documento', 'APROBAR_DOCUMENTO'], ['Ver auditoría', 'VER_AUDITORIA'],
  ['Gestionar usuarios', 'GESTIONAR_USUARIOS'], ['Asignar roles', 'ASIGNAR_ROLES'],
];

const politicas = [
  ['Estado del usuario', 'La cuenta debe permanecer ACTIVA para iniciar sesión y utilizar cualquier endpoint.'],
  ['Departamento', 'Gerentes, supervisores y empleados operan únicamente sobre documentos de su área.'],
  ['Nivel de seguridad', 'El nivel del usuario debe ser igual o mayor que la confidencialidad del recurso.'],
  ['Propiedad', 'Un empleado solo puede modificar documentos creados por él. Gerente y administrador están exceptuados.'],
  ['Horario', 'Los documentos nivel 4 o 5 solo se consultan entre 08:00 y 18:00.'],
  ['País', 'País del usuario y ubicación de la solicitud deben coincidir con el documento.'],
  ['Dispositivo', 'Las consultas de nivel 4 o 5 requieren un dispositivo CORPORATIVO.'],
  ['Invitados', 'Deben ser EXTERNOS y solo acceden a documentos PUBLICADOS de nivel 1.'],
];

const evidencias = [
  ['Docker Desktop', 'Captura securedocs-api y securedocs-db con estado healthy.'],
  ['Estado del servicio', 'GET /health con API activa y PostgreSQL connected.'],
  ['Autenticación JWT', 'Login del administrador con estado 200; oculta parte del token.'],
  ['Acceso permitido', 'Empleado consultando un documento de FINANZAS.'],
  ['Denegación RBAC', 'Empleado intentando aprobar un documento y respuesta 403 RBAC.'],
  ['ABAC por departamento', 'Empleado de FINANZAS intentando consultar RRHH.'],
  ['ABAC por nivel', 'Usuario nivel 2 intentando consultar documento nivel 4.'],
  ['ABAC por horario', 'Consulta confidencial con hora de prueba 20:00.'],
  ['ABAC por dispositivo', 'Documento nivel 5 solicitado desde dispositivo PERSONAL.'],
  ['Acceso de invitado', 'Documento público permitido y confidencial denegado.'],
  ['Auditoría', 'Tabla con decisiones PERMITIDO y DENEGADO y sus motivos.'],
  ['Base de datos', 'PgAdmin mostrando tablas y registros de auditorias.'],
  ['Pruebas completas', 'Terminal con npm test y npm run verify: 17 de 17.'],
  ['Aplicación web', 'Panel principal, simulador ABAC, matrices y centro de evidencias funcionando.'],
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function initials(name) {
  return String(name || 'US').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function can(action) {
  return permisos[state.usuario?.rol]?.includes(action) || false;
}

function contextHeaders() {
  return {
    'x-ubicacion': state.context.ubicacion,
    'x-dispositivo': state.context.dispositivo,
    ...(state.context.hora ? { 'x-hora-prueba': state.context.hora } : {}),
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.context === false ? {} : contextHeaders()),
      ...options.headers,
    },
  });
  let data = {};
  try { data = await response.json(); } catch { data = { message: 'Respuesta no válida del servidor' }; }
  if (response.status === 401 && path !== '/auth/login') endSession(false);
  if (!response.ok) {
    const error = new Error(data.message || 'No se pudo completar la operación');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function toast(title, message = '', type = 'success') {
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  $('#toast-region').append(element);
  setTimeout(() => element.remove(), 4200);
}

function setLoading(button, loading, text = 'Procesando…') {
  if (!button) return;
  if (loading) {
    button.dataset.original = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.original || button.textContent;
    button.disabled = false;
  }
}

function showLogin() {
  window.scrollTo(0, 0);
  $('#login-view').classList.remove('hidden');
  $('#app-view').classList.add('hidden');
}

function showApp() {
  window.scrollTo(0, 0);
  $('#login-view').classList.add('hidden');
  $('#app-view').classList.remove('hidden');
  configureUserInterface();
  showView('inicio');
}

function endSession(notify = true) {
  state.token = null;
  state.usuario = null;
  sessionStorage.removeItem('securedocs_token');
  showLogin();
  if (notify) toast('Sesión cerrada', 'El token fue descartado del navegador.');
}

function configureUserInterface() {
  const user = state.usuario;
  $('#profile-name').textContent = user.nombre;
  $('#profile-role').textContent = user.rol;
  $('#profile-avatar').textContent = initials(user.nombre);
  $('#welcome-title').textContent = `Hola, ${user.nombre.split(' ')[0]}`;
  $('#welcome-copy').textContent = `Sesión ${user.rol.toLowerCase()} en ${user.departamento}. Nivel de seguridad ${user.nivel_seguridad}.`;
  $('#rbac-summary').textContent = `${user.rol} · ${permisos[user.rol].length} permisos`;
  $$('.role-admin').forEach((el) => el.classList.toggle('hidden', !can('GESTIONAR_USUARIOS')));
  $$('.role-audit').forEach((el) => el.classList.toggle('hidden', !can('VER_AUDITORIA')));
  $('#new-document-button').classList.toggle('hidden', !can('CREAR_DOCUMENTO'));
  updateContextDisplay();
}

const viewNames = {
  inicio: ['Inicio', 'Panel de seguridad'], documentos: ['Documentos', 'Gestión documental'],
  usuarios: ['Usuarios', 'Usuarios y acceso'], auditoria: ['Auditoría', 'Registro de auditoría'],
  seguridad: ['Seguridad', 'Modelo RBAC y ABAC'], evidencias: ['Evidencias', 'Centro de evidencias'],
};

async function showView(name) {
  if (name === 'usuarios' && !can('GESTIONAR_USUARIOS')) return toast('Acceso restringido', 'Tu rol no gestiona usuarios.', 'error');
  if (name === 'auditoria' && !can('VER_AUDITORIA')) return toast('Acceso restringido', 'Tu rol no consulta auditoría.', 'error');
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  $$('.nav-item[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $('#breadcrumb-current').textContent = viewNames[name][0];
  $('#page-title').textContent = viewNames[name][1];
  window.scrollTo(0, 0);
  closeSidebar();
  if (name === 'inicio') await loadDashboard();
  if (name === 'documentos') await loadDocuments();
  if (name === 'usuarios') await loadUsers();
  if (name === 'auditoria') await loadAudit();
}

async function loadDashboard() {
  await loadDocuments(false);
  $('#metric-documents').textContent = state.documentos.length;
  renderRecentDocuments();
  if (can('VER_AUDITORIA')) {
    try {
      const data = await api('/auditoria?limite=100');
      state.auditorias = data.auditorias;
      $('#metric-allowed').textContent = data.auditorias.filter((a) => a.resultado === 'PERMITIDO').length;
      $('#metric-denied').textContent = data.auditorias.filter((a) => a.resultado === 'DENEGADO').length;
    } catch { $('#metric-allowed').textContent = '—'; $('#metric-denied').textContent = '—'; }
  } else {
    $('#metric-allowed').textContent = '—';
    $('#metric-denied').textContent = '—';
  }
  if (can('GESTIONAR_USUARIOS')) {
    try {
      const data = await api('/usuarios');
      state.usuarios = data.usuarios;
      $('#metric-users').textContent = data.total;
      $('#metric-users-copy').textContent = 'Cuentas registradas';
    } catch { $('#metric-users').textContent = '—'; }
  } else {
    $('#metric-users').textContent = state.usuario.nivel_seguridad;
    $('#metric-users-copy').textContent = 'Tu nivel de seguridad';
  }
}

async function loadDocuments(render = true) {
  try {
    const data = await api('/documentos');
    state.documentos = data.documentos;
    if (render) renderDocuments();
  } catch (error) {
    toast('No se cargaron los documentos', error.message, 'error');
    state.documentos = [];
    if (render) renderDocuments();
  }
}

function renderRecentDocuments() {
  const root = $('#recent-documents');
  if (!state.documentos.length) {
    root.innerHTML = '<p class="muted">No hay documentos visibles con el contexto actual.</p>';
    return;
  }
  root.innerHTML = state.documentos.slice(0, 5).map((doc) => `
    <div class="recent-document"><span class="document-icon">${doc.nivel_confidencialidad}</span><div><strong>${escapeHtml(doc.titulo)}</strong><small>${escapeHtml(doc.departamento)} · ${escapeHtml(doc.estado)}</small></div><span class="badge ${statusClass(doc.estado)}">${escapeHtml(doc.estado)}</span></div>
  `).join('');
}

function filteredDocuments() {
  const search = $('#document-search').value.trim().toLowerCase();
  const level = $('#document-level-filter').value;
  const status = $('#document-status-filter').value;
  return state.documentos.filter((doc) => {
    const text = `${doc.titulo} ${doc.descripcion} ${doc.departamento} ${doc.propietario_nombre}`.toLowerCase();
    return (!search || text.includes(search)) && (!level || String(doc.nivel_confidencialidad) === level) && (!status || doc.estado === status);
  });
}

function statusClass(status) {
  return ({ ACTIVO:'badge-green', PERMITIDO:'badge-green', PUBLICADO:'badge-green', APROBADO:'badge-blue', PENDIENTE:'badge-amber', DENEGADO:'badge-red', INACTIVO:'badge-gray', SUSPENDIDO:'badge-red', ARCHIVADO:'badge-gray' })[status] || 'badge-gray';
}

function renderDocuments() {
  const documents = filteredDocuments();
  $('#documents-empty').classList.toggle('hidden', documents.length > 0);
  $('.table-shell', $('#view-documentos')).classList.toggle('hidden', documents.length === 0);
  $('#documents-table').innerHTML = documents.map((doc) => {
    const actions = [
      `<button class="row-button" data-action="view-document" data-id="${doc.id}">Ver</button>`,
      can('MODIFICAR_DOCUMENTO') ? `<button class="row-button" data-action="edit-document" data-id="${doc.id}">Editar</button>` : '',
      can('APROBAR_DOCUMENTO') && doc.estado === 'PENDIENTE' ? `<button class="row-button" data-action="approve-document" data-id="${doc.id}">Aprobar</button>` : '',
      can('ELIMINAR_DOCUMENTO') ? `<button class="row-button danger" data-action="delete-document" data-id="${doc.id}">Eliminar</button>` : '',
    ].join('');
    return `<tr><td><div class="cell-main"><strong>${escapeHtml(doc.titulo)}</strong><small>${escapeHtml(doc.descripcion)}</small></div></td><td>${escapeHtml(doc.departamento)}</td><td><span class="level ${doc.nivel_confidencialidad >= 4 ? 'high' : ''}">${doc.nivel_confidencialidad}</span></td><td><span class="badge ${statusClass(doc.estado)}">${escapeHtml(doc.estado)}</span></td><td>${escapeHtml(doc.propietario_nombre)}</td><td><div class="row-actions">${actions}</div></td></tr>`;
  }).join('');
}

async function loadUsers() {
  try {
    const data = await api('/usuarios');
    state.usuarios = data.usuarios;
    renderUsers();
  } catch (error) { toast('No se cargaron los usuarios', error.message, 'error'); }
}

function renderUsers() {
  const search = $('#user-search').value.trim().toLowerCase();
  const users = state.usuarios.filter((user) => `${user.nombre} ${user.correo} ${user.rol} ${user.departamento}`.toLowerCase().includes(search));
  $('#users-table').innerHTML = users.map((user) => `<tr><td><div class="user-cell"><span class="avatar">${initials(user.nombre)}</span><div><strong>${escapeHtml(user.nombre)}</strong><small>${escapeHtml(user.correo)}</small></div></div></td><td>${escapeHtml(user.rol)}</td><td>${escapeHtml(user.departamento)}</td><td><span class="level ${user.nivel_seguridad >= 4 ? 'high' : ''}">${user.nivel_seguridad}</span></td><td>${escapeHtml(user.tipo_contrato)}</td><td><span class="badge ${statusClass(user.estado)}">${escapeHtml(user.estado)}</span></td><td><div class="row-actions"><button class="row-button" data-action="edit-user" data-id="${user.id}">Editar</button><button class="row-button ${user.estado === 'ACTIVO' ? 'danger' : ''}" data-action="toggle-user" data-id="${user.id}">${user.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</button></div></td></tr>`).join('');
}

async function loadAudit() {
  const result = $('#audit-result-filter').value;
  try {
    const data = await api(`/auditoria?limite=200${result ? `&resultado=${result}` : ''}`);
    state.auditorias = data.auditorias;
    $('#audit-table').innerHTML = data.auditorias.map((row) => `<tr><td>${new Date(row.fecha).toLocaleString('es-PE')}</td><td><div class="cell-main"><strong>${escapeHtml(row.usuario_correo || 'Desconocido')}</strong><small>ID ${row.usuario_id || '—'}</small></div></td><td><div class="cell-main"><strong>${escapeHtml(row.accion)}</strong><small>${escapeHtml(row.recurso)}</small></div></td><td><span class="badge ${statusClass(row.resultado)}">${escapeHtml(row.resultado)}</span><small class="badge badge-gray">${escapeHtml(row.tipo)}</small></td><td>${escapeHtml(row.motivo)}</td><td><div class="context-cell"><span>${escapeHtml(row.ubicacion || 'Sin ubicación')}</span><span>${escapeHtml(row.dispositivo || 'Sin dispositivo')}</span><span>${escapeHtml(row.direccion_ip || '')}</span></div></td></tr>`).join('');
  } catch (error) { toast('No se cargó la auditoría', error.message, 'error'); }
}

function renderSecurity() {
  const roles = ['ADMINISTRADOR','GERENTE','SUPERVISOR','EMPLEADO','AUDITOR','INVITADO'];
  $('#rbac-matrix').innerHTML = accionesMatriz.map(([label, action]) => `<tr><td>${label}</td>${roles.map((role) => `<td class="${permisos[role].includes(action) ? 'permission-yes' : 'permission-no'}">${permisos[role].includes(action) ? '✓' : '—'}</td>`).join('')}</tr>`).join('');
  $('#policy-grid').innerHTML = politicas.map(([name, description], index) => `<div class="policy-card"><span class="policy-number">0${index + 1}</span><h4>${name}</h4><p>${description}</p></div>`).join('');
}

function renderEvidence() {
  const checked = JSON.parse(localStorage.getItem('securedocs_evidence') || '[]');
  $('#evidence-checklist').innerHTML = evidencias.map(([title, description], index) => `<div class="check-item"><input id="evidence-${index}" type="checkbox" data-evidence="${index}" ${checked.includes(index) ? 'checked' : ''}><label for="evidence-${index}"><strong>${title}</strong><small>${description}</small></label></div>`).join('');
}

function updateContextDisplay() {
  $('#context-summary').textContent = `${state.context.ubicacion} · ${state.context.dispositivo}${state.context.hora ? ` · ${state.context.hora}` : ''}`;
  $('#context-location').value = state.context.ubicacion;
  $('#context-device').value = state.context.dispositivo;
  $('#context-time').value = state.context.hora;
}

function openEntityForm(type, entity = null, readOnly = false) {
  const dialog = $('#form-dialog');
  const content = $('#form-content');
  $('#form-error').textContent = '';
  $('#entity-form').dataset.type = type;
  $('#entity-form').dataset.id = entity?.id || '';
  $('#form-eyebrow').textContent = type === 'document' ? 'Recurso documental' : 'Identidad y acceso';
  $('#form-title').textContent = readOnly ? 'Detalle del documento' : `${entity ? 'Editar' : 'Crear'} ${type === 'document' ? 'documento' : 'usuario'}`;
  $('#form-submit').classList.toggle('hidden', readOnly);

  if (type === 'document') {
    content.innerHTML = `
      <label class="span-2">Título<input name="titulo" value="${escapeHtml(entity?.titulo || '')}" required ${readOnly ? 'disabled' : ''}></label>
      <label class="span-2">Descripción<textarea name="descripcion" required ${readOnly ? 'disabled' : ''}>${escapeHtml(entity?.descripcion || '')}</textarea></label>
      <label>Departamento<select name="departamento" required ${readOnly ? 'disabled' : ''}>${['FINANZAS','RRHH','SISTEMAS','LEGAL'].map((v) => `<option ${entity?.departamento === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Nivel de confidencialidad<select name="nivel_confidencialidad" required ${readOnly ? 'disabled' : ''}>${[1,2,3,4,5].map((v) => `<option value="${v}" ${Number(entity?.nivel_confidencialidad || 1) === v ? 'selected' : ''}>Nivel ${v}</option>`).join('')}</select></label>
      <label>País<select name="pais" required ${readOnly ? 'disabled' : ''}>${['PERU','CHILE','COLOMBIA','ECUADOR'].map((v) => `<option ${entity?.pais === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      ${entity ? `<label>Estado<input value="${escapeHtml(entity.estado)}" disabled></label><label class="span-2">Propietario<input value="${escapeHtml(entity.propietario_nombre)}" disabled></label>` : ''}`;
  } else {
    content.innerHTML = `
      <label class="span-2">Nombre completo<input name="nombre" value="${escapeHtml(entity?.nombre || '')}" required></label>
      <label class="span-2">Correo corporativo<input name="correo" type="email" value="${escapeHtml(entity?.correo || '')}" required></label>
      <label>Rol<select name="rol" required>${['ADMINISTRADOR','GERENTE','SUPERVISOR','EMPLEADO','AUDITOR','INVITADO'].map((v) => `<option ${entity?.rol === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Departamento<select name="departamento" required>${['FINANZAS','RRHH','SISTEMAS','LEGAL'].map((v) => `<option ${entity?.departamento === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Nivel de seguridad<select name="nivel_seguridad" required>${[1,2,3,4,5].map((v) => `<option value="${v}" ${Number(entity?.nivel_seguridad || 1) === v ? 'selected' : ''}>Nivel ${v}</option>`).join('')}</select></label>
      <label>País<select name="pais" required>${['PERU','CHILE','COLOMBIA','ECUADOR'].map((v) => `<option ${entity?.pais === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Tipo de contrato<select name="tipo_contrato" required>${['INTERNO','EXTERNO'].map((v) => `<option ${entity?.tipo_contrato === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Estado<select name="estado" required>${['ACTIVO','INACTIVO','SUSPENDIDO'].map((v) => `<option ${entity?.estado === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="span-2">${entity ? 'Nueva contraseña opcional' : 'Contraseña'}<input name="password" type="password" ${entity ? '' : 'required'} minlength="8"><small>${entity ? 'Déjala vacía para conservar la actual.' : 'Mínimo 8 caracteres.'}</small></label>`;
  }
  dialog.showModal();
}

async function submitEntity(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const type = form.dataset.type;
  const id = form.dataset.id;
  const body = Object.fromEntries(new FormData(form));
  delete body.type;
  if (body.password === '') delete body.password;
  if (body.nivel_confidencialidad) body.nivel_confidencialidad = Number(body.nivel_confidencialidad);
  if (body.nivel_seguridad) body.nivel_seguridad = Number(body.nivel_seguridad);
  const button = $('#form-submit');
  setLoading(button, true, 'Guardando…');
  $('#form-error').textContent = '';
  try {
    if (type === 'document') await api(id ? `/documentos/${id}` : '/documentos', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    else await api(id ? `/usuarios/${id}` : '/usuarios', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    $('#form-dialog').close();
    toast(type === 'document' ? 'Documento guardado' : 'Usuario guardado', 'La operación fue autorizada y auditada.');
    if (type === 'document') await loadDocuments(); else await loadUsers();
  } catch (error) {
    $('#form-error').textContent = `${error.data?.tipo ? `${error.data.tipo}: ` : ''}${error.message}`;
  } finally { setLoading(button, false); }
}

function askConfirmation(title, copy, action, danger = true) {
  const dialog = $('#confirm-dialog');
  $('#confirm-title').textContent = title;
  $('#confirm-copy').textContent = copy;
  $('#confirm-action').className = `button ${danger ? 'button-danger' : 'button-primary'}`;
  dialog.dataset.action = action;
  dialog.showModal();
}

async function handleConfirmedAction(action) {
  const [type, rawId] = action.split(':');
  const id = Number(rawId);
  try {
    if (type === 'delete-document') {
      await api(`/documentos/${id}`, { method: 'DELETE' });
      toast('Documento eliminado', 'La eliminación quedó registrada en auditoría.');
      await loadDocuments();
    } else if (type === 'approve-document') {
      await api(`/documentos/${id}/aprobar`, { method: 'POST' });
      toast('Documento aprobado', 'El estado cambió a APROBADO.');
      await loadDocuments();
    } else if (type === 'toggle-user') {
      const user = state.usuarios.find((item) => item.id === id);
      const estado = user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await api(`/usuarios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
      toast('Estado actualizado', `${user.nombre}: ${estado}`);
      await loadUsers();
    }
  } catch (error) { toast('Operación denegada', `${error.data?.tipo ? `${error.data.tipo}: ` : ''}${error.message}`, 'error'); }
}

function closeSidebar() {
  $('.sidebar').classList.remove('open');
  $('#sidebar-backdrop').classList.remove('show');
}

function bindEvents() {
  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('#login-submit');
    setLoading(button, true, 'Verificando identidad…');
    $('#login-error').textContent = '';
    try {
      const data = await api('/auth/login', { method: 'POST', context: false, body: JSON.stringify({ correo: $('#login-email').value, password: $('#login-password').value }) });
      state.token = data.token;
      state.usuario = data.usuario;
      sessionStorage.setItem('securedocs_token', state.token);
      showApp();
    } catch (error) { $('#login-error').textContent = `${error.data?.tipo ? `${error.data.tipo}: ` : ''}${error.message}`; }
    finally { setLoading(button, false); }
  });
  $('#toggle-password').addEventListener('click', () => {
    const input = $('#login-password');
    input.type = input.type === 'password' ? 'text' : 'password';
    $('#toggle-password').textContent = input.type === 'password' ? 'Ver' : 'Ocultar';
  });
  $('#logout-button').addEventListener('click', async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} endSession(); });
  $('#main-nav').addEventListener('click', (event) => { const button = event.target.closest('[data-view]'); if (button) showView(button.dataset.view); });
  $$('[data-go]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.go)));
  $('#menu-button').addEventListener('click', () => { $('.sidebar').classList.add('open'); $('#sidebar-backdrop').classList.add('show'); });
  $('#sidebar-backdrop').addEventListener('click', closeSidebar);
  $('#context-button').addEventListener('click', () => $('#context-dialog').showModal());
  $('#context-close').addEventListener('click', () => $('#context-dialog').close());
  $('#context-cancel').addEventListener('click', () => $('#context-dialog').close());
  $('#context-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    state.context = { ubicacion: $('#context-location').value, dispositivo: $('#context-device').value, hora: $('#context-time').value };
    localStorage.setItem('securedocs_context', JSON.stringify(state.context));
    updateContextDisplay();
    $('#context-dialog').close();
    toast('Contexto actualizado', 'Las próximas solicitudes usarán estos atributos ABAC.');
    if ($('#view-documentos').classList.contains('active')) await loadDocuments();
    if ($('#view-inicio').classList.contains('active')) await loadDashboard();
  });
  $('#new-document-button').addEventListener('click', () => openEntityForm('document'));
  $('#new-user-button').addEventListener('click', () => openEntityForm('user'));
  $('#form-close').addEventListener('click', () => $('#form-dialog').close());
  $('#form-cancel').addEventListener('click', () => $('#form-dialog').close());
  $('#entity-form').addEventListener('submit', submitEntity);
  $('#document-search').addEventListener('input', renderDocuments);
  $('#document-level-filter').addEventListener('change', renderDocuments);
  $('#document-status-filter').addEventListener('change', renderDocuments);
  $('#refresh-documents').addEventListener('click', () => loadDocuments());
  $('#user-search').addEventListener('input', renderUsers);
  $('#refresh-users').addEventListener('click', loadUsers);
  $('#refresh-audit').addEventListener('click', loadAudit);
  $('#audit-result-filter').addEventListener('change', loadAudit);
  $('#documents-table').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const document = state.documentos.find((item) => item.id === Number(button.dataset.id));
    if (button.dataset.action === 'view-document') openEntityForm('document', document, true);
    if (button.dataset.action === 'edit-document') openEntityForm('document', document);
    if (button.dataset.action === 'approve-document') askConfirmation('Aprobar documento', `¿Confirmas la aprobación de “${document.titulo}”?`, `approve-document:${document.id}`, false);
    if (button.dataset.action === 'delete-document') askConfirmation('Eliminar documento', `Esta acción eliminará “${document.titulo}”.`, `delete-document:${document.id}`);
  });
  $('#users-table').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const user = state.usuarios.find((item) => item.id === Number(button.dataset.id));
    if (button.dataset.action === 'edit-user') openEntityForm('user', user);
    if (button.dataset.action === 'toggle-user') askConfirmation(`${user.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'} usuario`, `Cambiarás el estado de ${user.nombre}.`, `toggle-user:${user.id}`, user.estado === 'ACTIVO');
  });
  $('#confirm-dialog').addEventListener('close', () => { if ($('#confirm-dialog').returnValue === 'confirm') handleConfirmedAction($('#confirm-dialog').dataset.action); });
  $('#evidence-checklist').addEventListener('change', () => {
    const selected = $$('[data-evidence]:checked').map((input) => Number(input.dataset.evidence));
    localStorage.setItem('securedocs_evidence', JSON.stringify(selected));
  });
  $('#print-evidence').addEventListener('click', () => window.print());
}

async function restoreSession() {
  if (!state.token) return showLogin();
  try {
    const data = await api('/auth/me');
    state.usuario = data.usuario;
    showApp();
  } catch { endSession(false); }
}

renderSecurity();
renderEvidence();
bindEvents();
restoreSession();
