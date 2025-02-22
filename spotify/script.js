//http://127.0.0.1:3000/spotify

console.log("Lets do javascript");
let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getAllSongs() {
    let allSongs = [];
    let folderResponse = await fetch('http://127.0.0.1:3000/spotify/songs/');
    let folderHTML = await folderResponse.text();
    let div = document.createElement("div");
    div.innerHTML = folderHTML;
    let anchors = div.getElementsByTagName("a");

    for (let anchor of anchors) {
        if (anchor.href.includes("/songs/") && !anchor.href.includes(".htaccess")) {
            let folder = anchor.href.split("/").slice(-2)[0];
            let songsResponse = await fetch(`http://127.0.0.1:3000/spotify/songs/${folder}/`);
            let songsHTML = await songsResponse.text();
            let songsDiv = document.createElement("div");
            songsDiv.innerHTML = songsHTML;
            let songLinks = songsDiv.getElementsByTagName("a");

            for (let song of songLinks) {
                if (song.href.endsWith(".mp4")) {
                    allSongs.push({
                        folder: folder,
                        name: song.href.split(`/songs/${folder}/`)[1]
                    });
                }
            }
        }
    }

    return allSongs;
}

const playMusic = (track, folder, pause = false) => {
    currFolder = folder;
    currentSong.src = `http://127.0.0.1:3000/spotify/songs/${folder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "svgs/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums");

    let folderResponse = await fetch('http://127.0.0.1:3000/spotify/songs/');
    let folderHTML = await folderResponse.text();
    let div = document.createElement("div");
    div.innerHTML = folderHTML;
    let anchors = div.getElementsByTagName("a");

    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];

            try {
                let metadataResponse = await fetch(`http://127.0.0.1:3000/spotify/songs/${folder}/info.json`);
                let metadata = await metadataResponse.json();

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="http://127.0.0.1:3000/spotify/songs/${folder}/cover.jpg" alt="${metadata.title}">
                        <h2>${metadata.title}</h2>
                        <p>${metadata.description}</p>
                    </div>`;
            } catch (error) {
                console.error(`Error loading album data for folder ${folder}:`, error);
            }
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let folder = item.currentTarget.dataset.folder;
            let folderSongs = songs.filter(song => song.folder === folder);
            console.log("Songs in this album:", folderSongs);

            let songList = document.querySelector(".songlist").getElementsByTagName("ul")[0];
            songList.innerHTML = "";
            folderSongs.forEach(song => {
                songList.innerHTML += `
                    <li>
                        <img src="svgs/music.svg" class="invert" alt="music">
                        <div class="info">
                            <div>${song.name.replaceAll("%20", " ")}</div>
                            <div>Rishabh</div>
                        </div>
                        <div class="playnow">
                            <span>Play Now</span>
                            <img src="svgs/play.svg" class="invert" alt="">
                        </div>
                    </li>`;
            });

            Array.from(songList.getElementsByTagName("li")).forEach((li, index) => {
                li.addEventListener("click", () => {
                    let songTitle = folderSongs[index].name;
                    playMusic(songTitle, folder);
                });
            });

            if (folderSongs.length > 0) {
                playMusic(folderSongs[0].name, folder);
            }
        });
    });
}

async function main() {
    songs = await getAllSongs();
    if (songs.length > 0) {
        playMusic(songs[0].name, songs[0].folder, true);
    }

    await displayAlbums();

    function togglePlayPause() {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "svgs/pause.svg";
        } else {
            currentSong.pause();
            play.src = "svgs/play.svg";
        }
    }
    
    // Add click event listener
    play.addEventListener("click", togglePlayPause);
    
    // Add keydown event listener for spacebar
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault(); // Prevent the default scrolling behavior
            togglePlayPause();
        }
    });
    

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    currentSong.addEventListener('loadeddata', () => {
        if (currentSong.duration && isFinite(currentSong.duration)) {
            currentSong.currentTime = 0;
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";

        if (currentSong.duration && isFinite(currentSong.duration)) {
            currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        } else {
            console.log('Invalid audio duration:', currentSong.duration);
        }
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.findIndex(song => song.name === currentSong.src.split("/").pop());
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1].name, songs[index - 1].folder);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.findIndex(song => song.name === currentSong.src.split("/").pop());
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1].name, songs[index + 1].folder);
        }
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("svgs/volume.svg")) {
            e.target.src = e.target.src.replace("svgs/volume.svg", "svgs/mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("svgs/mute.svg", "svgs/volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

main();
