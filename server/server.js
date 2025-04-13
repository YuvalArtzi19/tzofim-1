const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001; // Use port 3001 as a common alternative to 3000 (often used by client dev servers)

// Basic route for testing
app.get('/', (req, res) => {
  res.send('ScoutsTribe Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});