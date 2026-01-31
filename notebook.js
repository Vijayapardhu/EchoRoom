# Feature Implementation: Network Stats & Video Controls & Quality

## 1. Monitor Network Stats in `WebRTCManager.js`
- [ ] Add `monitorStats()` method to poll `peerConnection.getStats()`.
- [ ] Calculate `rtt` (ping) and `packetLoss` if available.
- [ ] Emit `stats` event.
- [ ] Start monitoring when connection is established.
- [ ] Stop monitoring on cleanup.

## 2. Expose Stats in `WebRTCContext.jsx`
- [ ] Listen for `stats` event from `WebRTCManager`.
- [ ] Store `stats` in state.
- [ ] Expose `connectionStats` in context provider.

## 3. Update `ConnectionIndicator.jsx`
- [ ] Use `connectionStats.rtt` from context to display ping.
- [ ] Show specific ping value instead of just "Waiting...".

## 4. Video Aspect Ratio Control in `Room.jsx`
- [ ] Add state `videoFit` ('cover' | 'contain').
- [ ] Add button to toggle `videoFit` on the Remote Video area.
- [ ] Apply class `object-cover` or `object-contain` based on state.

## 5. Improve Video Quality in `MediaManager.js`
- [ ] Modify `getDefaultConstraints` to request higher resolution/bitrate if possible, or at least verify `ideal` values are optimal. The current ones (720p) are decent, but we can try to tweak `min` width/height to force better quality if supported.

## 6. Implementation Steps
- Edit `client/src/services/WebRTCManager.js`
- Edit `client/src/context/WebRTCContext.jsx`
- Edit `client/src/services/MediaManager.js`
- Edit `client/src/components/ConnectionIndicator.jsx`
- Edit `client/src/components/Room.jsx`
