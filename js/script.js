
// ==========================================
// DATA LAYER (localStorage)
// ==========================================

// 1. Membaca data dari localStorage dan mengkonversi dari JSON ke array
function getData() {
    const raw = localStorage.getItem('sila_data');
    // Jika ada data, parse JSON array; jika tidak, kembalikan array kosong
    return raw ? JSON.parse(raw) : [];
}

// 2. Menyimpan data ke localStorage (array dikonversi ke string JSON)
function saveData(data) {
    localStorage.setItem('sila_data', JSON.stringify(data));
}


// ==========================================
// HELPERS (Fungsi Pembantu)
// ==========================================

// Mengubah format tanggal '2024-01-05' menjadi '5 Jan 2024'
function formatTanggal(dateStr) {
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
}


// ==========================================
// FORM HANDLING
// ==========================================
// Menangani form pengajuan: mode tambah (create)
//  dan mode edit (update) berdasarkan parameter URL
// tugas form: mengumpulkan input user, validasi, creat data baru, updete data baru,
//  lalu simpan ke localStorage.

function initForm() {
    const form = document.getElementById('formPengajuan');
    if (!form) return; // jika halaman tidak punya form, keluar

    // - Deteksi Mode Edit
    // URLSearchParams membaca parameter dari URL, contoh: layanan.html?edit=1234 -> editId = '1234'
    // jika parametar edit ditemuka, maka data lama ajann tampilkan, kembali ke dalam From.
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    let editMode = false;

    if (editId) {
        // Cari item yang akan diedit berdasarkan ID
        const data = getData();
        const itemToEdit = data.find(function (item) { return item.id == editId; 
        });

        if (itemToEdit) {
            editMode = true;

            // Isi field form dengan data yang ada (pre-fill)
            document.getElementById('nama').value = itemToEdit.nama || '';
            document.getElementById('nim').value = itemToEdit.nim || '';
            
            const prodiEl = document.getElementById('prodi');
            if (prodiEl && itemToEdit.prodi) prodiEl.value = itemToEdit.prodi;

            const layananEl = document.getElementById('layanan');
            if (layananEl && itemToEdit.layanan) layananEl.value = itemToEdit.layanan;

            document.getElementById('tanggal').value = itemToEdit.tanggal || '';
            document.getElementById('keterangan').value = itemToEdit.keterangan || '';

            // Ubah teks tombol submit menjadi "Simpan Perubahan"
            const btnSubmit = form.querySelector('button[type="submit"]');
            if (btnSubmit) btnSubmit.innerHTML = 'Simpan Perubahan';
        }
    }

    // - Event Listener: Submit Form
    form.addEventListener('submit', function (e) {
        e.preventDefault(); // mencegah form reload halaman (default browser)

        // Ambil nilai semua field (trim() = hapus spasi di awal/akhir)
        const nama = document.getElementById('nama').value.trim();
        const nim = document.getElementById('nim').value.trim();
        const prodi = document.getElementById('prodi').value;
        const layanan = document.getElementById('layanan').value;
        const tanggal = document.getElementById('tanggal').value;
        const keterangan = document.getElementById('keterangan').value.trim();

        const errorEl = document.getElementById('formError');
        // Reset pesan error sebelum validasi
        if (errorEl) errorEl.textContent = '';

        // Validasi Input: Semua field wajib diisi
        if (!nama || !nim || !prodi || !layanan || !tanggal) {
            if (errorEl) errorEl.textContent = 'X Semua field wajib harus diisi!';
            return; // hentikan eksekusi jika tidak valid
        }

        // Validasi NIM: Harus tepat 8 digit angka
        if (nim.length !== 8 || isNaN(nim)) {
            if (errorEl) errorEl.textContent = 'X NIM harus terdiri dari 8 digit angka!';
            return; // hentikan proses
        }

        // - CRUD: Create atau Update
        const data = getData();

        if (editMode) {
            // UPDATE: cari item berdasarkan ID, lalu update propertinya
            for (let i = 0; i < data.length; i++) {
                if (data[i].id == editId) {
                    data[i].nama = nama;
                    data[i].nim = nim;
                    data[i].prodi = prodi;
                    data[i].layanan = layanan;
                    data[i].tanggal = tanggal;
                    data[i].keterangan = keterangan;
                    break;
                }
            }
        } else {
            // CREATE: buat objek baru, ID menggunakan timestamp (unik)
            const item = {
                id: Date.now(), // timestamp dalam milidetik sebagai ID unik
                nama: nama,
                nim: nim,
                prodi: prodi,
                layanan: layanan,
                tanggal: tanggal,
                keterangan: keterangan
            };
            data.push(item); // tambahkan ke ujung array
        }

        saveData(data); // simpan ke localStorage

        // Reset form dan redirect ke halaman riwayat
        form.reset();
        if (errorEl) errorEl.textContent = '';

        alert(editMode ? 'Perubahan berhasil disimpan!' : 'Pengajuan berhasil disimpan!');
        window.location.href = 'riwayat.html'; // pindah halaman
    });
}


// ==========================================
// TABEL RIWAYAT
// ==========================================
// Menampilkan semua data pengajuan dalam tabel HTML, serta menangani tombol Edit dan Hapus per baris.

function initRiwayat() {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const dataCount = document.getElementById('dataCount');
    const btnHapusSemua = document.getElementById('btnHapusSemua');

    if (!tbody) return; // jika bukan halaman riwayat, keluar
    renderTable(); // tampilkan tabel saat halaman pertama dimuat

    // - Event Listener: Tombol Hapus Semua
    if (btnHapusSemua) {
        btnHapusSemua.addEventListener('click', function () {
            // confirm() menampilkan dialog konfirmasi, mengembalikan true/false
            if (confirm('Apakah Anda yakin ingin menghapus semua data?')) {
                saveData([]); // simpan array kosong (hapus semua)
                renderTable(); // render ulang tabel
            }
        });
    }

    // - Fungsi Render Tabel
    function renderTable() {
        const data = getData();

        // Update teks counter jumlah data
        if (dataCount) {
            dataCount.textContent = data.length + ' pengajuan';
        }

        // Jika data kosong: tampilkan empty state, sembunyikan tombol hapus semua
        if (data.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (btnHapusSemua) btnHapusSemua.style.display = 'none';
            return;
        }

        // Sembunyikan empty state, tampilkan tombol hapus semua
        if (emptyState) emptyState.style.display = 'none';
        if (btnHapusSemua) btnHapusSemua.style.display = 'inline-block';

        // Buat baris tabel (tr) untuk setiap item data
        tbody.innerHTML = ''; // bersihkan isi tbody terlebih dulu
        
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const tr = document.createElement('tr'); // buat elemen <tr> baru

            // innerHTML: isi baris dengan data dari objek item
            tr.innerHTML = '<td>' + (i + 1) + '</td>' +
                           '<td>' + item.nama + '</td>' +
                           '<td>' + item.nim + '</td>' +
                           '<td>' + item.layanan + '</td>' +
                           '<td>' + formatTanggal(item.tanggal) + '</td>' +
                           '<td>' +
                               '<button class="btn-edit" data-id="' + item.id + '">Edit</button>' + ' ' +
                               '<button class="btn-hapus" data-id="' + item.id + '">Hapus</button>' +
                           '</td>';

            tbody.appendChild(tr); // tambahkan baris ke tabel
        }

        // - Event Listener: Tombol Edit (Dinamis setelah render)
        const btnEdit = document.querySelectorAll('.btn-edit');
        btnEdit.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id'); // ambil ID dari atribut
                // Redirect ke form dengan parameter edit di URL
                window.location.href = 'layanan.html?edit=' + id;
            });
        });

        // - Event Listener: Tombol Hapus (Dinamis setelah render)
        const btnHapus = document.querySelectorAll('.btn-hapus');
        btnHapus.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = Number(this.getAttribute('data-id'));
                if (confirm('Hapus pengajuan ini?')) {
                    let data = getData();
                    // filter(): buat array baru tanpa item yang dihapus
                    data = data.filter(function (item) {
                        return item.id !== id; // pertahankan semua kecuali yang di-hapus
                    });
                    saveData(data);
                    renderTable(); // render ulang tabel setelah penghapusan
                }
            });
        });
    }
}


// ==========================================
// INIT (Inisialisasi)
// ==========================================
// DOMContentLoaded: event yang terjadi ketika seluruh HTML selesai dimuat oleh browser.
// Pastikan JavaScript dijalankan SETELAH HTML tersedia.

document.addEventListener('DOMContentLoaded', function () {
    initForm();    // inisialisasi form di halaman layanan.html
    initRiwayat(); // inisialisasi tabel di halaman riwayat.html
});
