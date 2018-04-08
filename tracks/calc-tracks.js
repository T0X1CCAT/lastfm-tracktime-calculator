const axios = require('axios');

//holds all the tracks ever listened to ?
let artist_tracks = [];
let trackTimes = [];


exports.totalTrackTime = (api_key) => {

    axios.get('http://ws.audioscrobbler.com/2.0', {
        params: {
            api_key: api_key,
            page: 1,
            user: 't0x1ccat',
            format: 'json',
            limit: 200,

            method: 'user.getrecenttracks'
        }})
        .then((response) => {

        const totalPages = response.data.recenttracks["@attr"].totalPages;

    console.log('pages', totalPages);
    let tracks = parseTrackData(response.data.recenttracks.track);
    //console.log('tracks', tracks);
    artist_tracks = tracks;
    console.log('original array lenght ', artist_tracks.length);

    //get all remaining pages of tracks
    getRemainingTracks(api_key, totalPages).then(() => {
        calculateTrackTime(api_key);
});
})
.catch((error) => {
        console.log('error', error);
});

};

/**
 * tjhis is stupid - thousands of requests to get track time
 * @param api_key
 */
const calculateTrackTime = (api_key) => {

    console.log('calculate track time');
    const batchSize = 20;

    let batchNumber = 1;
    let start = 0;
    let end = batchSize-1;
    getTrackInfoBatch(api_key, start, end, batchSize, batchNumber);



};

const getTrackInfoBatch = (api_key, start, end, batchSize, batchNumber) => {

    let trackTimePromiseBatch = [];
    let artist_track_batch = artist_tracks.slice(start, end);
    const numberBatches = artist_tracks.length / batchSize;
    //const numberBatches = 3;
    console.log('number of batches is ', numberBatches);
    console.log('track time batch number ', batchNumber);
    console.log('track time batch pos ', start, end);


    for (let artist_track of artist_track_batch) {
        console.log('query artist track ', artist_track);
        let trackTimePromise = axios.get('http://ws.audioscrobbler.com/2.0', {
            params: {
                api_key: api_key,
                track: artist_track.name,
                artist: artist_track.artist,
                format: 'json',
                method: 'track.getinfo'
            }
        })
            .then((response) => {
            console.log('add duration', response.data.track.duration);
        trackTimes.push(response.data.track.duration);
        console.log('trackTimes length', trackTimes.length);
    })
    .catch((error) => {
            console.log('error getting track time for ', artist_track, error);
    });
        trackTimePromiseBatch.push(trackTimePromise);
    }
    Promise.all(trackTimePromiseBatch).then(() => {
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
        let totalTimeListened = 0;
        for (let i = 0; i < trackTimes.length; i++) {
            totalTimeListened = +totalTimeListened + +trackTimes[i];
        }
        console.log('total millis ', totalTimeListened);
        console.log('total hours ', (totalTimeListened / 1000 / 60 / 60));
    }
});



};
const parseTrackData = (tracks) => {

    return tracks.map((track) => ({artist: track.artist["#text"], name: track.name}));

};

getRemainingTracks = (api_key, total_pages) => {

    let promises = [];

    for(let i = 2; i < total_pages; i++){
        let pr = axios.get('http://ws.audioscrobbler.com/2.0', {
            params: {
                api_key: api_key,
                page: i,
                user: 't0x1ccat',
                format: 'json',
                limit: 200,

                method: 'user.getrecenttracks'
            }})
            .then((response) => {
            let tracks = parseTrackData(response.data.recenttracks.track);
        console.log('page no ' + i +' done');
        artist_tracks =[...artist_tracks, ...tracks];
        console.log('length of arrray ', artist_tracks.length);

    })
    .catch((error) => {
            console.log('error', error);
    });
        promises.push(pr);

    }
    return Promise.all(promises);

};
