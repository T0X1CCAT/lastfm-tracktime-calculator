'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.totalTrackTime = undefined;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

//holds all the tracks ever listened to ?
var artist_tracks = [];
var trackTimes = [];

var totalTrackTime = exports.totalTrackTime = function totalTrackTime(api_key) {

    _axios2.default.get('http://ws.audioscrobbler.com/2.0', {
        params: {
            api_key: api_key,
            page: 1,
            user: 't0x1ccat',
            format: 'json',
            limit: 200,

            method: 'user.getrecenttracks'
        } }).then(function (response) {

        var totalPages = response.data.recenttracks["@attr"].totalPages;

        console.log('pages', totalPages);
        var tracks = parseTrackData(response.data.recenttracks.track);
        //console.log('tracks', tracks);
        artist_tracks = tracks;
        console.log('original array lenght ', artist_tracks.length);

        //get all remaining pages of tracks
        getRemainingTracks(api_key, totalPages).then(function () {
            calculateTrackTime(api_key);
        });
    }).catch(function (error) {
        console.log('error', error);
    });
};

/**
 * tjhis is stupid - thousands of requests to get track time
 * @param api_key
 */
var calculateTrackTime = function calculateTrackTime(api_key) {

    console.log('calculate track time');
    var batchSize = 20;

    var batchNumber = 1;
    var start = 0;
    var end = batchSize - 1;
    getTrackInfoBatch(api_key, start, end, batchSize, batchNumber);
};

var getTrackInfoBatch = function getTrackInfoBatch(api_key, start, end, batchSize, batchNumber) {

    var trackTimePromiseBatch = [];
    var artist_track_batch = artist_tracks.slice(start, end);
    var numberBatches = artist_tracks.length / batchSize;
    //const numberBatches = 3;
    console.log('number of batches is ', numberBatches);
    console.log('track time batch number ', batchNumber);
    console.log('track time batch pos ', start, end);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        var _loop = function _loop() {
            var artist_track = _step.value;

            console.log('query artist track ', artist_track);
            var trackTimePromise = _axios2.default.get('http://ws.audioscrobbler.com/2.0', {
                params: {
                    api_key: api_key,
                    track: artist_track.name,
                    artist: artist_track.artist,
                    format: 'json',
                    method: 'track.getinfo'
                }
            }).then(function (response) {
                console.log('add duration', response.data.track.duration);
                trackTimes.push(response.data.track.duration);
                console.log('trackTimes length', trackTimes.length);
            }).catch(function (error) {
                console.log('error getting track time for ', artist_track, error);
            });
            trackTimePromiseBatch.push(trackTimePromise);
        };

        for (var _iterator = artist_track_batch[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            _loop();
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    Promise.all(trackTimePromiseBatch).then(function () {
        //recursively call this function until all batches done
        start = end + 1;
        end = end + batchSize;
        batchNumber += 1;
        if (batchNumber < numberBatches) {
            getTrackInfoBatch(api_key, start, end, batchSize, batchNumber);
        } else {
            console.log('return promise');
            //add up all the time
            console.log('all finished: add all the durations together');
            var totalTimeListened = 0;
            for (var i = 0; i < trackTimes.length; i++) {
                totalTimeListened = +totalTimeListened + +trackTimes[i];
            }
            console.log('total millis ', totalTimeListened);
            console.log('total hours ', totalTimeListened / 1000 / 60 / 60);
        }
    });
};
var parseTrackData = function parseTrackData(tracks) {

    return tracks.map(function (track) {
        return { artist: track.artist["#text"], name: track.name };
    });
};

var getRemainingTracks = function getRemainingTracks(api_key, total_pages) {

    var promises = [];

    var _loop2 = function _loop2(i) {
        var pr = _axios2.default.get('http://ws.audioscrobbler.com/2.0', {
            params: {
                api_key: api_key,
                page: i,
                user: 't0x1ccat',
                format: 'json',
                limit: 200,

                method: 'user.getrecenttracks'
            } }).then(function (response) {
            var tracks = parseTrackData(response.data.recenttracks.track);
            console.log('page no ' + i + ' done');
            artist_tracks = [].concat(_toConsumableArray(artist_tracks), _toConsumableArray(tracks));
            console.log('length of arrray ', artist_tracks.length);
        }).catch(function (error) {
            console.log('error', error);
        });
        promises.push(pr);
    };

    for (var i = 2; i < total_pages; i++) {
        _loop2(i);
    }
    return Promise.all(promises);
};