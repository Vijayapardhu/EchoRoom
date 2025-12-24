// Utility for generating system sounds using Web Audio API
// This avoids the need for external asset files

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (freq, type, duration, startTime = 0) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, audioContext.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(audioContext.currentTime + startTime);
    osc.stop(audioContext.currentTime + startTime + duration);
};

export const playMessageSound = () => {
    if (audioContext.state === 'suspended') audioContext.resume();
    // High ping for message
    playTone(800, 'sine', 0.1);
};

export const playJoinSound = () => {
    if (audioContext.state === 'suspended') audioContext.resume();
    // Ascending chime
    playTone(400, 'sine', 0.1, 0);
    playTone(600, 'sine', 0.1, 0.1);
};

export const playLeaveSound = () => {
    if (audioContext.state === 'suspended') audioContext.resume();
    // Descending chime
    playTone(600, 'sine', 0.1, 0);
    playTone(400, 'sine', 0.1, 0.1);
};

export const playErrorSound = () => {
    if (audioContext.state === 'suspended') audioContext.resume();
    // Low buzz
    playTone(150, 'sawtooth', 0.2);
};
