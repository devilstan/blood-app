const storageKey = 'blood-pressure-records';
const form = document.querySelector('#pressure-form');
const recordsBody = document.querySelector('#records');
const emptyState = document.querySelector('#empty-state');
const recordCount = document.querySelector('#record-count');
const message = document.querySelector('#form-message');
const themeToggle = document.querySelector('#theme-toggle');
const themeMessage = document.querySelector('#theme-message');
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeStorageKey = 'blood-pressure-theme';
const systemTheme = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

let records = [];
let hasManualTheme = false;

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', `目前為${isDark ? '深色' : '淺色'}主題，切換為${isDark ? '淺色' : '深色'}主題`);
  themeColor.setAttribute('content', isDark ? '#1b211f' : '#f6f7f4');
}

try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  hasManualTheme = savedTheme === 'dark' || savedTheme === 'light';
} catch (error) {
  // The switch remains usable for this page even when preference storage is blocked.
}

applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  hasManualTheme = true;
  applyTheme(nextTheme);

  try {
    localStorage.setItem(themeStorageKey, nextTheme);
    themeMessage.textContent = '';
  } catch (error) {
    themeMessage.textContent = '主題選擇可能無法保留，請檢查瀏覽器的儲存設定。';
  }
});

function followSystemTheme(event) {
  if (!hasManualTheme) applyTheme(event.matches ? 'dark' : 'light');
}

if (systemTheme && systemTheme.addEventListener) {
  systemTheme.addEventListener('change', followSystemTheme);
} else if (systemTheme) {
  systemTheme.addListener(followSystemTheme);
}

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) records = saved;
} catch (error) {
  message.textContent = '無法讀取儲存的紀錄，請檢查瀏覽器的儲存設定。';
}

function saveRecords(nextRecords) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextRecords));
    records = nextRecords;
    message.textContent = '';
    return true;
  } catch (error) {
    message.textContent = '無法儲存紀錄，請檢查瀏覽器的儲存設定。';
    return false;
  }
}

function makeCell(text, className) {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderRecords() {
  recordsBody.replaceChildren();
  emptyState.hidden = records.length > 0;
  recordCount.replaceChildren(document.createTextNode(`${records.length} `));
  const unit = document.createElement('small');
  unit.textContent = '筆';
  recordCount.append(unit);

  records.forEach((record, index) => {
    const row = document.createElement('tr');
    const date = new Date(record.createdAt);
    const dateCell = makeCell(date.toLocaleDateString('zh-TW'), 'date');
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    dateCell.append(time);
    const pressure = makeCell('', 'pressure');
    pressure.append(document.createTextNode(record.systolic), Object.assign(document.createElement('span'), { textContent: '/' }), document.createTextNode(record.diastolic));
    const medication = makeCell('');
    const medicationLabel = document.createElement('span');
    medicationLabel.className = record.medication === '未服藥' ? 'medication pending' : 'medication';
    medicationLabel.textContent = record.medication;
    medication.append(medicationLabel);
    const actions = makeCell('');
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '刪除';
    deleteButton.setAttribute('aria-label', `刪除 ${date.toLocaleString('zh-TW')} 的紀錄`);
    deleteButton.addEventListener('click', () => {
      if (saveRecords(records.filter((item, itemIndex) => itemIndex !== index))) renderRecords();
    });
    actions.append(deleteButton);
    row.append(dateCell, pressure, makeCell(`${record.pulse} 次 / 分`, 'pulse'), medication, makeCell(record.note || '—', 'note'), actions);
    recordsBody.append(row);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const record = {
    systolic: data.get('systolic'),
    diastolic: data.get('diastolic'),
    pulse: data.get('pulse'),
    medication: data.get('medication'),
    note: data.get('note').trim(),
    createdAt: new Date().toISOString()
  };
  if (saveRecords([record, ...records])) {
    form.reset();
    renderRecords();
  }
});

renderRecords();