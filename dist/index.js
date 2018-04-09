'use strict';

var _calcTracks = require('./tracks/calc-tracks');

var api_key = process.env.API_KEY;
(0, _calcTracks.totalTrackTime)(api_key);