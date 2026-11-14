/**
 * Entry point backend StudyTrack.
 *
 * Membuat aplikasi dari `app.js` lalu menjalankan server.
 */
import { PORT } from "./config.js";
import { createApp } from "./app.js";

createApp().listen(PORT, () => {
  console.log(`StudyTrack backend berjalan di http://localhost:${PORT}`);
});
