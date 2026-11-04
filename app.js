let cars = [];
let chart;

const model = document.getElementById('model');

async function initialize() {
  try {
    const response = await fetch('cars.json');
    if (!response.ok) {
      throw new Error(`Gagal memuatkan cars.json (${response.status})`);
    }

    cars = await response.json();
    populateModels();
    loadColours();
    createChart();
    registerListeners();
    calculate();
  } catch (error) {
    console.error(error);
    document.getElementById('quoteText').textContent =
      'Data model tidak dapat dimuatkan. Jalankan laman melalui web server.';
  }
}

function populateModels() {
  cars.forEach((car, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = car.name;
    model.appendChild(option);
  });
}

function loadColours() {
  const car = cars[Number(model.value)];
  const colourSelect = document.getElementById('colour');
  colourSelect.replaceChildren();

  car.colors.forEach((colour) => {
    const option = document.createElement('option');
    option.value = colour;
    option.textContent = colour;
    colourSelect.appendChild(option);
  });
}

function registerListeners() {
  model.addEventListener('change', () => {
    loadColours();
    calculate();
  });

  document.getElementById('depositPct').addEventListener('input', (event) => {
    document.getElementById('depositLabel').textContent = `${event.target.value}%`;
    calculate();
  });

  ['tradein', 'rebate', 'years', 'bank'].forEach((id) => {
    document.getElementById(id).addEventListener('input', calculate);
    document.getElementById(id).addEventListener('change', calculate);
  });
}

function payment(principal, annualRate, months) {
  const monthlyRate = (annualRate / 100) / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

function createChart() {
  chart = new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels: ['5 Tahun', '7 Tahun', '9 Tahun'],
      datasets: [{ label: 'Ansuran', data: [0, 0, 0] }]
    }
  });
}

function calculate() {
  if (!cars.length || !chart) return;

  const car = cars[Number(model.value)];
  const depositPct = Number(document.getElementById('depositPct').value);
  const tradein = Number(document.getElementById('tradein').value || 0);
  const rebate = Number(document.getElementById('rebate').value || 0);
  const years = Number(document.getElementById('years').value);
  const rate = Number(document.getElementById('bank').value);

  const deposit = car.price * (depositPct / 100);
  const loan = Math.max(0, car.price - deposit - tradein - rebate);
  const monthly = payment(loan, rate, years * 12);

  document.getElementById('otr').textContent = `RM ${car.price.toLocaleString()}`;
  document.getElementById('dep').textContent = `RM ${deposit.toFixed(0)}`;
  document.getElementById('loan').textContent = `RM ${loan.toFixed(0)}`;
  document.getElementById('monthly').textContent = `RM ${monthly.toFixed(0)}`;

  chart.data.datasets[0].data = [
    payment(loan, rate, 60).toFixed(0),
    payment(loan, rate, 84).toFixed(0),
    payment(loan, rate, 108).toFixed(0)
  ];
  chart.update();

  const bank = document.getElementById('bank');
  const bankName = bank.options[bank.selectedIndex].text;
  const customerName = document.getElementById('custName').value || '-';

  document.getElementById('quoteText').textContent =
    `Pelanggan :\n${customerName}\n\n` +
    `Model :\n${car.name}\n\n` +
    `Harga :\nRM ${car.price.toLocaleString()}\n\n` +
    `Deposit :\nRM ${deposit.toFixed(0)}\n\n` +
    `Pinjaman :\nRM ${loan.toFixed(0)}\n\n` +
    `Ansuran :\nRM ${monthly.toFixed(0)} / bulan\n\n` +
    `Tempoh :\n${years} Tahun\n\n` +
    `Bank :\n${bankName}`;
}

function saveCustomer() {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  customers.push({
    name: document.getElementById('custName').value,
    phone: document.getElementById('custPhone').value,
    model: cars[Number(model.value)].name
  });

  localStorage.setItem('customers', JSON.stringify(customers));
  alert('Pelanggan disimpan');
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}

initialize();
