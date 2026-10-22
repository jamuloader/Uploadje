// ==========================================
// KONFIGURASI UTAMA (GANTI DENGAN ID ANDA)
// ==========================================
const ID_FOLDER_UTAMA = "1tXqdLbVA9ZQ8Sija5TIBQkIRChvA4jM4"; 

function doGet(e) {
  const page = e.parameter.page || 'dashboard';
  let template;
  
  if (page === 'form') {
    template = HtmlService.createTemplateFromFile('Formulir');
  } else {
    template = HtmlService.createTemplateFromFile('Dashboard');
  }
  
  return template.evaluate()
    .setTitle("Sistem Manajemen File Hub")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Helper untuk menyertakan file HTML lain tanpa tag ganda
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Mengambil data struktur folder dari sheet 'master_folder'
function getFolderStructure() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('master_folder');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    // Hapus header
    data.shift(); 
    return data;
  } catch (err) {
    return [];
  }
}

// Mengambil data log dari sheet 'log_upload'
function getUploadLogs() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('log_upload');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    data.shift(); // Hapus header
    
    // Balik urutan agar data terbaru berada di paling atas
    return data.reverse().map((row, index) => {
      let formattedDate = "";
      if (row[0] instanceof Date) {
        formattedDate = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      } else {
        formattedDate = String(row[0]);
      }
      return {
        no: index + 1,
        timestamp: formattedDate,
        fileName: row[1] || "",
        folderPath: row[2] || "",
        fileUrl: row[3] || "",
        fileSize: row[4] || "-" // Mengambil nilai kapasitas dari kolom ke-5 (Indeks 4)
      };
    });
  } catch (err) {
    return [];
  }
}

// Proses pencarian atau pembuatan folder bertingkat (Find or Create)
function getOrCreateTargetFolder(pathArray) {
  let currentFolder = DriveApp.getFolderById(ID_FOLDER_UTAMA);
  
  for (let i = 0; i < pathArray.length; i++) {
    const folderName = pathArray[i].trim();
    if (!folderName) break;
    
    const subFolders = currentFolder.getFoldersByName(folderName);
    if (subFolders.hasNext()) {
      currentFolder = subFolders.next();
    } else {
      currentFolder = currentFolder.createFolder(folderName);
    }
  }
  return currentFolder;
}

// Proses Upload Banyak File sekaligus (Versi Perbaikan Kolom Ukuran)
function uploadMultipleFiles(filesData, pathArray) {
  try {
    const targetFolder = getOrCreateTargetFolder(pathArray);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('log_upload');
    
    if (!sheet) {
      sheet = ss.insertSheet('log_upload');
      sheet.appendRow(["Timestamp", "Nama File", "Jalur Folder Tujuan", "Link Drive", "Ukuran"]);
    }
    
    const folderPathStr = pathArray.filter(Boolean).join('/');
    
    filesData.forEach(fileObj => {
      const byteData = Utilities.base64Decode(fileObj.base64.split(',')[1]);
      const blob = Utilities.newBlob(byteData, fileObj.type, fileObj.name);
      
      const newFile = targetFolder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // Hitung ukuran file asli dari Drive
      const sizeInBytes = newFile.getSize();
      let formattedSize = "";
      if (sizeInBytes >= 1048576) {
        formattedSize = (sizeInBytes / 1048576).toFixed(2) + " MB";
      } else {
        formattedSize = (sizeInBytes / 1024).toFixed(2) + " KB";
      }
      
      // Masukkan baris data lengkap ke 5 kolom di Spreadsheet
      sheet.appendRow([new Date(), newFile.getName(), folderPathStr, newFile.getUrl(), formattedSize]);
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==========================================
// FUNGSI UNTUK TES KONEKSI & DIAGNOSIS
// ==========================================
function testSystemConnection() {
  const report = [];
  report.push("=== MEMULAI DIAGNOSIS SISTEM ===");
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    report.push("✅ Berhasil terhubung ke Google Spreadsheet: " + ss.getName());
    
    const masterSheet = ss.getSheetByName('master_folder');
    if (masterSheet) {
      const data = masterSheet.getDataRange().getValues();
      report.push(`✅ Tab 'master_folder' DITEMUKAN. Jumlah baris data (termasuk header): ${data.length}`);
    } else {
      report.push("❌ Eror: Tab dengan nama 'master_folder' TIDAK DITEMUKAN.");
    }
    
    const logSheet = ss.getSheetByName('log_upload');
    if (logSheet) {
      report.push(`✅ Tab 'log_upload' DITEMUKAN. Jumlah log tersimpan: ${logSheet.getLastRow() - 1}`);
    } else {
      report.push("ℹ️ Info: Tab 'log_upload' belum dibuat.");
    }
    
  } catch (err) {
    report.push("❌ Eror internal Spreadsheet: " + err.toString());
  }
  
  try {
    if (!ID_FOLDER_UTAMA || ID_FOLDER_UTAMA === "ID_FOLDER_DRIVE_ANDA") {
      report.push("❌ Eror: Variabel ID_FOLDER_UTAMA belum diubah.");
    } else {
      const folder = DriveApp.getFolderById(ID_FOLDER_UTAMA);
      report.push("✅ Berhasil terhubung ke Google Drive!");
      report.push("   -> Nama Folder Utama: " + folder.getName());
    }
  } catch (err) {
    report.push("❌ Eror Google Drive: " + err.toString());
  }
  
  report.push("=== DIAGNOSIS SELESAI ===");
  Logger.log(report.join("\n"));
  return report.join("\n");
}
