import React, { useRef, useState, useEffect } from 'react';

const ScreenRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [time, setTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const videoRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        let timer = null;
        if (isRecording && !isPaused) {
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else if (isPaused || !isRecording) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [isRecording, isPaused]);

    const startRecording = async () => {
        setTime(0); // Reset the timer
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
        ]);

        videoRef.current.srcObject = combinedStream;
        videoRef.current.play();

        const mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm; codecs=vp9,opus'
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);

            combinedStream.getTracks().forEach(track => track.stop());
            screenStream.getTracks().forEach(track => track.stop());
            audioStream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        setIsPaused(false);
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div>
            <h1>Screen Recorder</h1>
            <div>
                {isRecording ? (
                    <>
                        {isPaused ? (
                            <button onClick={resumeRecording}>Resume</button>
                        ) : (
                            <button onClick={pauseRecording}>Pause</button>
                        )}
                        <button onClick={stopRecording}>Stop Recording</button>
                    </>
                ) : (
                    <button onClick={startRecording}>Start Recording</button>
                )}
            </div>
            {isRecording && <div>Recording Time: {formatTime(time)}</div>}
            <div>
                <video ref={videoRef} style={{ width: '100%' }} controls />
            </div>
            {videoUrl && (
                <div>
                    <h2>Recorded Video</h2>
                    <video src={videoUrl} style={{ width: '100%' }} controls />
                    <a href={videoUrl} download="recording.webm">
                        <button>Download Video</button>
                    </a>
                </div>
            )}
        </div>
    );
};

export default ScreenRecorder;
