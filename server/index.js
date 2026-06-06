// Local development entry point: start the Express app on a port.
// (On Vercel the app is imported by ../api/index.js instead.)
import app from './app.js';
import { PORT } from './config.js';

app.listen(PORT, () => {
  console.log(`SnippetHub API running at http://localhost:${PORT}`);
});
