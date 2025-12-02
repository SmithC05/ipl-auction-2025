import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface UseAudioStreamProps {
    socket: Socket | null;
    roomId: string | null;
    isHost: boolean;
}

export const useAudioStream = ({ socket, roomId, isHost }: UseAudioStreamProps) => {
    const [isListening, setIsListening] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    // WebRTC Configuration
    const rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Public STUN server
        ],
    };

    // Initialize Audio Element
    useEffect(() => {
        if (!remoteAudioRef.current) {
            remoteAudioRef.current = new Audio();
            remoteAudioRef.current.autoplay = true;
        }
    }, []);

    // Host: Start Broadcasting
    const startBroadcast = async () => {
        if (!socket || !roomId || !isHost) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false
            });

            localStream.current = stream;
            peerConnection.current = new RTCPeerConnection(rtcConfig);

            // Add tracks to PC
            stream.getTracks().forEach(track => {
                peerConnection.current?.addTrack(track, stream);
            });

            // Handle ICE Candidates
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('audio_signal', { roomId, type: 'candidate', payload: event.candidate });
                }
            };

            // Create Offer
            const offer = await peerConnection.current.createOffer();

            // Force Opus / Low Bitrate in SDP
            const sdp = offer.sdp?.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=12000');
            await peerConnection.current.setLocalDescription({ type: 'offer', sdp });

            socket.emit('audio_signal', { roomId, type: 'offer', payload: peerConnection.current.localDescription });
            setIsBroadcasting(true);

        } catch (err) {
            console.error('Error starting broadcast:', err);
        }
    };

    // Client: Start Listening
    const startListening = () => {
        setIsListening(true);
        // Signal to host that we are ready? 
        // Actually, in this simple model, we wait for an offer from the host.
        // But since the host might have already started, we might need to request an offer.
        // For simplicity, we'll assume the host sends offers to everyone or we just join the room.
    };

    // Handle Signaling
    useEffect(() => {
        if (!socket) return;

        socket.on('audio_signal', async (data: { type: string; payload: any }) => {
            if (!peerConnection.current) {
                peerConnection.current = new RTCPeerConnection(rtcConfig);

                // Handle incoming tracks (Client side)
                peerConnection.current.ontrack = (event) => {
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = event.streams[0];
                        if (isListening) remoteAudioRef.current.play().catch(console.error);
                    }
                };

                // Handle ICE Candidates
                peerConnection.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('audio_signal', { roomId, type: 'candidate', payload: event.candidate });
                    }
                };
            }

            try {
                if (data.type === 'offer') {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.payload));
                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);
                    socket.emit('audio_signal', { roomId, type: 'answer', payload: answer });
                } else if (data.type === 'answer') {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.payload));
                } else if (data.type === 'candidate') {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.payload));
                }
            } catch (err) {
                console.error('Signaling error:', err);
            }
        });

        return () => {
            socket.off('audio_signal');
        };
    }, [socket, roomId, isListening]);

    // Cleanup
    useEffect(() => {
        return () => {
            localStream.current?.getTracks().forEach(track => track.stop());
            peerConnection.current?.close();
        };
    }, []);

    return {
        isListening,
        isBroadcasting,
        startBroadcast,
        stopBroadcast: () => {
            localStream.current?.getTracks().forEach(track => track.stop());
            setIsBroadcasting(false);
        },
        startListening,
        stopListening: () => setIsListening(false)
    };
};
