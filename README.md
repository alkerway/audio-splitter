## Audio Splitter
Audio splitter is an API wrapper around the [spleeter](https://github.com/deezer/spleeter/) source separation library. It allows one to both isolate and remove certain instruments from an audio file.
For example, a request to isolate the drum part and bass part and remove the bass and vocals for an audio file `audio.wav` would return a .zip file with `drums.wav`, `bass.wav`, `nobass.wav` and `novocals.wav`.
  
A front-end for selecting the audio file and spleeter options can be found here:
https://github.com/alkerway/audio-splitter-ui

#### Usage
1. Install the following:
    * node
    * ffmpeg
    * docker and the [spleeter image](https://github.com/deezer/spleeter/wiki/2.-Getting-started#using-docker-image)
2. Clone the repository
3. Run `npm install`
4. Run `npm build`
5. All output is in the `./dist` directory - serve `index.js`
6. Use with [front-end above](https://github.com/alkerway/audio-splitter-ui) or your own
