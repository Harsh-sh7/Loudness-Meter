async function startDecibelMeter() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Float32Array(analyser.fftSize);
        const freqData = new Uint8Array(analyser.frequencyBinCount);

        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.3;
        microphone.connect(analyser);

        const dbBar = document.getElementById('dbBar');
        const freqBar = document.getElementById('freqBar');
        const decibelDisplay = document.querySelector('.decibel-display');
        const frequencyDisplay = document.querySelector('.frequency-display');

        const dbCanvas = document.getElementById("dbGraph");
        const freqCanvas = document.getElementById("freqGraph");
        const dbCtx = dbCanvas.getContext("2d");
        const freqCtx = freqCanvas.getContext("2d");

        dbCanvas.width = 400;
        dbCanvas.height = 200;
        freqCanvas.width = 400;
        freqCanvas.height = 200;

        let dbHistory = new Array(50).fill(10);
        let freqHistory = new Array(50).fill(1000);
        let lastUpdate = 0;

        function updateDecibelMeter() {
            let now = Date.now();
            if (now - lastUpdate < 500) {
                requestAnimationFrame(updateDecibelMeter);
                return;
            }
            lastUpdate = now;

            analyser.getFloatTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            let rms = Math.sqrt(sum / dataArray.length);
            let dB = 20 * Math.log10(rms) + 120;

            dB = Math.max(10, Math.min(200, dB));

            analyser.getByteFrequencyData(freqData);
            let maxIndex = freqData.indexOf(Math.max(...freqData));
            let frequency = maxIndex * (audioContext.sampleRate / analyser.fftSize);

            if (frequency < 20) frequency = 20; 
            if (frequency > 10000) frequency = 10000; 

            let dbPercent = ((dB - 10) / 190) * 100;
            let freqPercent = ((frequency - 20) / (5000 - 20)) * 100;

            dbBar.style.height = dbPercent + "%";
            freqBar.style.height = freqPercent + "%";

            decibelDisplay.textContent = `🔊 ${Math.round(dB)} dB`;
            frequencyDisplay.textContent = `🎶 ${Math.round(frequency)} Hz`;

            dbHistory.push(dB);
            freqHistory.push(frequency);
            if (dbHistory.length > 50) dbHistory.shift();
            if (freqHistory.length > 50) freqHistory.shift();

            drawGraph(dbCtx, dbHistory, 200, "#28a745", "Decibel (dB)");
            drawGraph(freqCtx, freqHistory, 5000, "#17a2b8", "Frequency (Hz)");

            requestAnimationFrame(updateDecibelMeter);
        }

        function drawGraph(ctx, data, maxVal, color, label) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
            ctx.fillStyle = "#ffffff"; 
            ctx.strokeStyle = "#444"; 
            ctx.lineWidth = 1;
        

            for (let i = 0; i <= maxVal; i += maxVal / 5) {
                let y = ctx.canvas.height - (ctx.canvas.height * (i / maxVal));
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(ctx.canvas.width, y);
                ctx.stroke();
                ctx.fillText(i + " " + label, 5, y - 5); 
            }
        
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            let stepX = ctx.canvas.width / data.length;
            ctx.moveTo(0, ctx.canvas.height - (ctx.canvas.height * (data[0] / maxVal)));
        
            for (let i = 1; i < data.length; i++) {
                let x = i * stepX;
                let y = ctx.canvas.height - (ctx.canvas.height * (data[i] / maxVal));
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        updateDecibelMeter();

    } catch (error) {
        alert("🚫 Microphone Access Denied");
    }
}

startDecibelMeter();