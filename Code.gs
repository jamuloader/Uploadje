// ==========================================
// 1. KONFIGURASI (GANTI DENGAN ID ANDA)
// ==========================================

// Tempel ID Spreadsheet Anda di antara tanda kutip di bawah ini
const ID_SPREADSHEET = "17KtHOK_omV1motXFUEmes-49yffkE11t0oI1gSyknGw"; 

// Tempel ID Folder 'Uploads' Anda di antara tanda kutip di bawah ini
const ID_FOLDER_UPLOADS = "1jVndFPbyB5-Af0EJEYAEbEv3hRuJVhAp"; 


// ==========================================
// 2. FUNGSI TESTING KONEKSI
// ==========================================
function testKoneksi() {
  try {
    var sheet = SpreadsheetApp.openById(ID_SPREADSHEET).getActiveSheet();
    // Logger.log("✅ Spreadsheet: " + sheet.getName());
  } catch (e) { Logger.log("❌ Spreadsheet Gagal: " + e.message); }

  try {
    var folder = DriveApp.getFolderById(ID_FOLDER_UPLOADS);
    // Logger.log("✅ Folder: " + folder.getName());
  } catch (e) { Logger.log("❌ Folder Gagal: " + e.message); }
}

// ==========================================
// 3. LOGIKA INTI: CEK FOLDER & FILE
// ==========================================
function cekFolderDanFile(namaFolderTujuan, namaFile) {
 //  Logger.log("🔍 Cek Folder: '" + namaFolderTujuan + "', File: '" + namaFile + "'");
  
  var daftarFolder = DriveApp.getFoldersByName(namaFolderTujuan);
  var folderTujuan;
  
  if (daftarFolder.hasNext()) {
    folderTujuan = daftarFolder.next();
    // Logger.log("✅ Folder DITEMUKAN.");
  } else {
   // Logger.log("⚠️ Folder TIDAK DITEMUKAN. Membuat baru...");
    var folderUtama = DriveApp.getFolderById(ID_FOLDER_UPLOADS);
    folderTujuan = folderUtama.createFolder(namaFolderTujuan);
    // Logger.log("✅ Folder BARU dibuat.");
  }
  
  var daftarFile = folderTujuan.getFilesByName(namaFile);
  if (daftarFile.hasNext()) {
    // Logger.log("❌ GAGAL: File '" + namaFile + "' SUDAH ADA!");
    return "GAGAL: File sudah ada, tidak bisa upload duplikat.";
  } else {
   //  Logger.log("✅ File BELUM ADA. Aman untuk upload.");
    return "SUKSES: File aman untuk diupload.";
  }
}

// ==========================================
// 4. FUNGSI UPLOAD SESUNGGUHNYA
// ==========================================
function uploadFile(namaFolderTujuan, namaFile, dataFile) {
  // Logger.log("🚀 MULAI UPLOAD: " + namaFile + " ke folder: " + namaFolderTujuan);
  
  // 1. Cek dulu
  var hasilCek = cekFolderDanFile(namaFolderTujuan, namaFile);
  
  // 2. Jika gagal, stop dan catat
  if (hasilCek.indexOf("GAGAL") !== -1) {
    catatKeSheets(namaFile, namaFolderTujuan, "GAGAL - File duplikat");
    return hasilCek;
  }
  
  // 3. Ambil folder tujuan (untuk menyimpan)
  var daftarFolder = DriveApp.getFoldersByName(namaFolderTujuan);
  var folderTujuan = daftarFolder.hasNext() ? daftarFolder.next() : DriveApp.getFolderById(ID_FOLDER_UPLOADS).createFolder(namaFolderTujuan);
  
  // 4. BUAT FILE DI DRIVE
 // Logger.log("💾 Menyimpan file ke Drive...");
  var fileBaru = folderTujuan.createFile(dataFile);
  fileBaru.setName(namaFile); 
  
  
  
  return "SUKSES: File berhasil diupload!";
}

// ==========================================
// 5. FUNGSI CATAT KE SHEETS (DIPERBAIKI: 4 PARAMETER & AMAN)
// ==========================================
function catatKeSheets(namaFile, namaFolder, status, urlFile) {
  var ss = SpreadsheetApp.openById(ID_SPREADSHEET);
  var sheet = ss.getSheets()[0]; // PENTING: Paksa ambil Sheet PERTAMA (Database Upload)
  
  // Menulis 5 kolom: A=Waktu, B=Nama, C=Folder, D=Status, E=URL
  sheet.appendRow([new Date(), namaFile, namaFolder, status, urlFile]);
  // Logger.log(" Berhasil mencatat ke Sheet: " + sheet.getName());
}

// ==========================================
// 6. FUNGSI TESTING UPLOAD (JALANKAN INI!)
// ==========================================
function testUpload() {
  // Logger.log("🕵️ DETEKTIF 1: Fungsi testUpload BARU telah dimulai!");
  
  var namaFolder = "Dokumen Proyek A";
  var namaFile = "laporan.pdf";
  
  // Logger.log("🕵️ DETEKTIF 2: Isi variabel sekarang -> Folder: '" + namaFolder + "', File: '" + namaFile + "'");
  
  var dataFile = Utilities.newBlob("Ini adalah isi file dummy untuk testing.", MimeType.PLAIN_TEXT, namaFile);
  
 //  Logger.log("🕵️ DETEKTIF 3: Akan memanggil uploadFile sekarang...");
  
  var hasil = uploadFile(namaFolder, namaFile, dataFile);
  
  // Logger.log("🏁 HASIL AKHIR: " + hasil);
}

// ==========================================
// 7. FUNGSI PINTU MASUK WEB APP (doGet)
// ==========================================
function doGet(e) {
  var page = e.parameter.page;
  
  if (!page) {
    return HtmlService.createTemplateFromFile('Index').evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  return HtmlService.createTemplateFromFile(page).evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}


// ==========================================
// FUNGSI UPLOAD KHUSUS DARI WEB APP (BASE64)
// ==========================================

// ==========================================
// FUNGSI BANTUAN: MEMBUAT FOLDER BERTINGKAT
// ==========================================
function buatFolderBertingkat(folderInduk, pathFolder) {
  // pathFolder contoh: "Klaster 1/SOP"
  var bagianFolder = pathFolder.split("/"); // Pecah jadi ["Klaster 1", "SOP"]
  var folderSaatIni = folderInduk;
  
  for (var i = 0; i < bagianFolder.length; i++) {
    var nama = bagianFolder[i];
    var cekFolder = folderSaatIni.getFoldersByName(nama);
    
    if (cekFolder.hasNext()) {
      // Jika sudah ada, masuk ke folder tersebut
      folderSaatIni = cekFolder.next();
    } else {
      // Jika belum ada, buat baru di dalam folder saat ini
      folderSaatIni = folderSaatIni.createFolder(nama);
    }
  }
  return folderSaatIni; // Kembalikan folder paling dalam (SOP)
}

function uploadFileDariWeb(namaFolderTujuan, namaFile, base64Data) {
 // Logger.log("🚀 MULAI UPLOAD DARI WEB: " + namaFile + " ke: " + namaFolderTujuan);
  
  // --- LANGKAH A: Ubah Base64 jadi Blob ---
  var commaIndex = base64Data.indexOf(',');
  var contentType = base64Data.substring(5, commaIndex);
  var base64String = base64Data.substring(commaIndex + 1);
  var decodedBytes = Utilities.base64Decode(base64String);
  var dataFile = Utilities.newBlob(decodedBytes, contentType, namaFile);
  
  // --- LANGKAH B: Cek Duplikasi & Buat Folder Bertingkat ---
  var folderInduk = DriveApp.getFolderById(ID_FOLDER_UPLOADS);
  
  // Gunakan fungsi baru untuk mencari/membuat folder bertingkat
  var folderTujuan = buatFolderBertingkat(folderInduk, namaFolderTujuan);
  
  // Cek apakah file sudah ada di folder tujuan (paling dalam)
  var daftarFile = folderTujuan.getFilesByName(namaFile);
  if (daftarFile.hasNext()) {
    
      // Jika GAGAL, URL-nya kosong ("")
  catatKeSheets(namaFile, namaFolderTujuan, "GAGAL - File duplikat (via Web)", "");
    return "GAGAL: File '" + namaFile + "' sudah ada di folder ini!";
  }
  
  // --- LANGKAH C: Simpan File ---
 // Logger.log(" Menyimpan file ke Drive...");
  var fileBaru = folderTujuan.createFile(dataFile);
  fileBaru.setName(namaFile); 
  
      // Jika SUKSES, masukkan URL file-nya
  catatKeSheets(namaFile, namaFolderTujuan, "SUKSES (via Web)", fileBaru.getUrl());
  return "SUKSES: File berhasil diupload ke " + namaFolderTujuan + "!";
}


// ==========================================
// 9. FUNGSI MENGAMBIL DATA MASTER FOLDER (CASCADE)
// ==========================================

function getMasterFolderData() {
  var sheet = SpreadsheetApp.openById(ID_SPREADSHEET).getSheetByName('Master Folder');
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return { klasterList: [], subFolderMap: {} }; 
  
  // Ambil 3 kolom (A, B, C)
  var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  
  var klasterList = []; 
  var subFolderMap = {}; 
  
  for (var i = 0; i < data.length; i++) {
    var klaster = String(data[i][0]).trim(); 
    var subFolder = String(data[i][1]).trim(); 
    var subSubFolder = String(data[i][2]).trim(); // Baca kolom C
    
    if (klaster === "" || subFolder === "") continue; 
    
    if (klasterList.indexOf(klaster) === -1) {
      klasterList.push(klaster);
    }
    
    if (!subFolderMap[klaster]) {
      subFolderMap[klaster] = {};
    }
    
    // Jika subFolder ini belum ada di dalam klaster, buat array kosong
    if (!subFolderMap[klaster][subFolder]) {
      subFolderMap[klaster][subFolder] = [];
    }
    
    // Jika ada sub-sub folder (Kolom C tidak kosong), tambahkan ke array
    if (subSubFolder !== "" && subFolderMap[klaster][subFolder].indexOf(subSubFolder) === -1) {
      subFolderMap[klaster][subFolder].push(subSubFolder);
    }
  }
  
  return {
    klasterList: klasterList,
    subFolderMap: subFolderMap
  };
}

// ==========================================
// 10. FUNGSI MENGAMBIL DATA UNTUK DASHBOARD (AMAN)
// ==========================================
function getDaftarFileSukses() {
  // Logger.log("📊 Dashboard meminta daftar file...");
  
  var ss = SpreadsheetApp.openById(ID_SPREADSHEET);
  var sheet = ss.getSheets()[0]; 
  
  var data = sheet.getDataRange().getValues(); 
  var hasil = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var status = row[3]; // Kolom D (Status)
    
    if (status && status.toString().indexOf("SUKSES") !== -1) {
      // PERBAIKAN: Ubah format tanggal menjadi String sebelum dikirim ke HTML
      var waktuString = "";
      if (row[0] instanceof Date) {
        // Jika formatnya Date object, ubah jadi teks
        waktuString = row[0].toISOString(); 
      } else {
        // Jika sudah berupa teks
        waktuString = String(row[0]); 
      }

      hasil.push({
        waktu: waktuString, // Kirim dalam bentuk teks
        namaFile: String(row[1]),
        folder: String(row[2]),
        url: String(row[4]) 
      });
    }
  }
  
  // Logger.log("✅ Ditemukan " + hasil.length + " file sukses.");
  return hasil; 
}

// ==========================================
// FUNGSI HAPUS FILE
// ==========================================
function hapusFileDanCatat(namaFile, namaFolder) {
  try {
    var folderInduk = DriveApp.getFolderById(ID_FOLDER_UPLOADS);
    
    // Pecah path folder (misal: "Klaster 1/SOP")
    var bagianFolder = namaFolder.split("/");
    var folderSaatIni = folderInduk;
    
    // Telusuri folder hingga ke paling dalam
    for (var i = 0; i < bagianFolder.length; i++) {
      var cekFolder = folderSaatIni.getFoldersByName(bagianFolder[i]);
      if (cekFolder.hasNext()) {
        folderSaatIni = cekFolder.next();
      } else {
        return "GAGAL: Folder tidak ditemukan!";
      }
    }
    
    // Cari file di folder paling dalam
    var daftarFile = folderSaatIni.getFilesByName(namaFile);
    if (daftarFile.hasNext()) {
      var file = daftarFile.next();
      file.setTrashed(true); // Pindahkan ke Trash
      
      // Update Status di Spreadsheet
      updateStatusDiSheets(namaFile, namaFolder);
      return "SUKSES: File berhasil dihapus!";
    } else {
      return "GAGAL: File tidak ditemukan di Drive!";
    }
  } catch (e) {
    return "ERROR: " + e.toString();
  }
}

// Fungsi Bantuan: Mengubah status di Spreadsheet
function updateStatusDiSheets(namaFile, namaFolder) {
  var ss = SpreadsheetApp.openById(ID_SPREADSHEET);
  var sheet = ss.getSheets()[0]; 
  var data = sheet.getDataRange().getValues();
  
  // Cari baris yang cocok
  for (var i = 1; i < data.length; i++) {
    // data[i][1] adalah Nama File (Kolom B), data[i][2] adalah Folder (Kolom C)
    if (data[i][1] === namaFile && data[i][2] === namaFolder) {
      // Ubah kolom D (Status) menjadi "DIHAPUS". (Index array dimulai dari 0, jadi col D = index 3)
      sheet.getRange(i + 1, 4).setValue("DIHAPUS"); 
      break;
    }
  }
}