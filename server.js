const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    if (req.method === "GET" && req.url === "/artists") {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(artists));
    }

    if (req.method === "GET" && req.url.match(/^\/artists\/\d+$/)) {
      const artistId = parseInt(req.url.split('/')[2]);
      const artist = Object.values(artists).find(a => a.artistId === artistId);
      if (artist) {
        const artistAlbums = Object.values(albums).filter(album => album.artistId === artistId);
        const response = {...artist, albums: artistAlbums };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(response));
      }else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({error: "Artist not found" }));
      }
    }

    if (req.method === "POST" && req.url === '/artists') {
      const newArtist = req.body;
      const artistId = getNewArtistId();
      const artist = { ...newArtist, artistId };
      artists[artistId] = artist;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(artist));
    }

    if (req.method === "PUT" && req.url.match(/^\/artists\/\d+$/)) {
      const artistId = parseInt(req.url.split('/') [2]);
      const updatedArtistData = req.body;
      const artist = Object.values(artists).find(a => a.artistId === artistId);
      if (artist) {
        Object.assign(artist, updatedArtistData);
        artist.updatedAt = new Date().toISOString();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(artist));
      }else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({error: "Artist not found" }));
      }
    }

    if (req.method === "DELETE" && req.url.match(/^\/artists\/\d+$/)) {
      const artistId = parseInt(req.url.split('/') [2]);
      const artistIndex = Object.values(artists).findIndex(a => a.artistId === artistId);
      if (artistIndex !== -1) {
        delete artists[artistId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ message: "Successfully deleted" }));
      }else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ message: "Successfully deleted" }));
      }
    }

    if (req.method === "GET" && req.url.match(/^\/artists\/\d+\/albums$/)) {
      const artistId = parseInt(req.url.split('/')[2]);
      const artist = Object.values(artists).find(a => a.artistId === artistId);
      if (artist) {
        const artistAlbums = Object.values(albums).filter(album => album.artistId === artistId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(artistAlbums));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Artist not found" }));
      }
    }

    if (req.method === "GET" && req.url.match(/^\/albums\/\d+$/)) {
      const albumId = parseInt(req.url.split('/')[2]);
      const album = Object.values(albums).find(a => a.albumId === albumId);
      if (album) {
        const artist = Object.values(artists).find(a => a.artistId === album.artistId);
        const albumSongs = Object.values(songs).filter(song => song.albumId === albumId);
        const response = { ...album, artist, songs: albumSongs };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(response));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Album not found" }));
      }
    }

    if (req.method === "POST" && req.url.match(/^\/artists\/\d+\/albums$/)) {
      const artistId = parseInt(req.url.split('/')[2]);
      const artist = Object.values(artists).find(a => a.artistId === artistId);
      if (artist) {
        const newAlbum = req.body;
        const albumId = getNewAlbumId();
        const album = { ...newAlbum, albumId, artistId };
        albums.push(album);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(album));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Artist not found" }));
      }
    }

    if (req.method === "PUT" && req.url.match(/^\/albums\/\d+$/)) {
      const albumId = parseInt(req.url.split('/')[2]);
      const updatedAlbumData = req.body;
      const album = Object.values(albums).find(a => a.albumId === albumId);
      if (album) {
        Object.assign(album, updatedAlbumData);
        album.updatedAt = new Date().toISOString();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(album));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Album not found" }));
      }
    }

    if (req.method === "DELETE" && req.url.match(/^\/albums\/\d+$/)) {
      const albumId = parseInt(req.url.split('/')[2]);
      const albumIndex = Object.values(albums).findIndex(a => a.albumId === albumId);
      if (albumIndex !== -1) {
        albums.splice(albumIndex, 1);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ message: "Successfully deleted" }));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Album not found" }));
      }
    }

    if (req.method === "GET" && req.url.match(/^\/artists\/\d+\/songs$/)) {
      const artistId = parseInt(req.url.split('/')[2]);
      const artist = Object.values(artists).find(a => a.artistId === artistId);
      if (artist) {
        const artistSongs = Object.values(songs).filter(song => song.artistId === artistId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(artistSongs));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Artist not found" }));
      }
    }

    if (req.method === "GET" && req.url.match(/^\/albums\/\d+\/songs$/)) {
      const albumId = parseInt(req.url.split('/')[2]);
      const album = Object.values(albums).find(a => a.albumId === albumId);
      if (album) {
        const albumSongs = Object.values(songs).filter(song => song.albumId === albumId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(albumSongs));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Album not found" }));
      }
    }

    if (req.method === "GET" && req.url.match(/^\/trackNumbers\/\d+\/songs$/)) {
      const trackNumber = parseInt(req.url.split('/')[2]);
      const trackSongs = Object.values(songs).filter(song => song.trackNumber === trackNumber);
      if (trackSongs.length > 0) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(trackSongs));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "No songs found for track number" }));
      }
    }

    if (req.method === "GET" && req.url.match(/^\/songs\/\d+$/)) {
      const songId = parseInt(req.url.split('/')[2]);
      const song = Object.values(songs).find(s => s.songId === songId);
      if (song) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(song));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Song not found" }));
      }
    }

    if (req.method === "POST" && req.url.match(/^\/albums\/\d+\/songs$/)) {
      const albumId = parseInt(req.url.split('/')[2]);
      const album = Object.values(albums).find(a => a.albumId === albumId);
      if (album) {
        const newSong = req.body;
        const songId = getNewSongId(); // Function to generate new songId
        const song = { ...newSong, songId, albumId };
        songs.push(song); // Assuming `songs` is an array
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(song));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Album not found" }));
      }
    }

    if (req.method === "PUT" && req.url.match(/^\/songs\/\d+$/)) {
      const songId = parseInt(req.url.split('/')[2]);
      const updatedSongData = req.body;
      const song = Object.values(songs).find(s => s.songId === songId);
      if (song) {
        Object.assign(song, updatedSongData);
        song.updatedAt = new Date().toISOString(); // Update timestamp
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(song));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Song not found" }));
      }
    }

    if (req.method === "DELETE" && req.url.match(/^\/songs\/\d+$/)) {
      const songId = parseInt(req.url.split('/')[2]);
      const songIndex = Object.values(songs).findIndex(s => s.songId === songId);
      if (songIndex !== -1) {
        songs.splice(songIndex, 1); // Remove the song from the array
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ message: "Song successfully deleted" }));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Song not found" }));
      }
    }



    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => console.log('Server is listening on port', port));
