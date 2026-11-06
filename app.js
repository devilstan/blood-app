const storageKey = 'blood-pressure-records';
const form = document.querySelector('#pressure-form');
const recordsBody = document.querySelector('#records');
const emptyState = document.querySelector('#empty-state');
const recordCount = document.querySelector('#record-count');
const message = document.querySelector('#form-message');

let records = [];
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