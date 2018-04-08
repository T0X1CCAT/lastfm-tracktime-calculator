const calctracks = require('./tracks/calc-tracks.js');

const api_key = process.env.API_KEY;
calctracks.totalTrackTime(api_key);
