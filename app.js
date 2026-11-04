let cars = [];
let chart;

const model = document.getElementById('model');

function formatRM(amount) {
  return `RM ${Number(amount).toLocaleString('ms-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

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
    option.textContent = `${car.category} — ${car.variant}`;
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

  document.getElementById('otrWithoutInsurance').textContent = formatRM(car.priceWithoutInsurance);
  document.getElementById('estimatedInsurance').textContent = formatRM(car.estimatedInsurance);
  document.getElementById('otr').textContent = formatRM(car.price);
  document.getElementById('dep').textContent = formatRM(deposit);
  document.getElementById('loan').textContent = formatRM(loan);
  document.getElementById('monthly').textContent = formatRM(monthly);

  chart.data.datasets[0].data = [
    payment(loan, rate, 60).toFixed(0),
    payment(loan, rate, 84).toFixed(0),
    payment(loan, rate, 108).toFixed(0)
  ];
  chart.update();

  const bank = document.getElementById('bank');
  const bankName = bank.options[bank.selectedIndex].text;
  const customerName = document.getElementById('custName').value || '-';
  const selectedColour = document.getElementById('colour').value;

  document.getElementById('quoteText').textContent =
    `Pelanggan :\n${customerName}\n\n` +
    `Model :\n${car.category}\n\n` +
    `Varian :\n${car.variant}\n\n` +
    `Warna :\n${selectedColour}\n\n` +
    `Harga tanpa insurans :\n${formatRM(car.priceWithoutInsurance)}\n\n` +
    `Anggaran insurans :\n${formatRM(car.estimatedInsurance)}\n\n` +
    `Harga OTR (termasuk anggaran insurans) :\n${formatRM(car.price)}\n\n` +
    `Deposit :\n${formatRM(deposit)}\n\n` +
    `Pinjaman :\n${formatRM(loan)}\n\n` +
    `Ansuran :\n${formatRM(monthly)} / bulan\n\n` +
    `Tempoh :\n${years} Tahun\n\n` +
    `Bank :\n${bankName}`;
}

function saveCustomer() {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const car = cars[Number(model.value)];
  customers.push({
    name: document.getElementById('custName').value,
    phone: document.getElementById('custPhone').value,
    model: `${car.category} ${car.variant}`
  });

  localStorage.setItem('customers', JSON.stringify(customers));
  alert('Pelanggan disimpan');
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}

initialize();
