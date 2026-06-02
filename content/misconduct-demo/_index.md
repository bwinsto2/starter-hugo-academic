---
title: "Therapist Misconduct Monitoring - Demo"
date: 2024-01-01
type: docs
---

{{< rawhtml >}}
<style>
        .tm-demo-shell,
        .tm-demo-shell * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .tm-demo-shell {
            font-size: clamp(14px, 2vw, 18px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: #1f2933;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
            border: 1px solid rgba(21, 101, 192, 0.12);
            border-radius: 20px;
            padding: clamp(16px, 3vw, 28px);
            margin: clamp(8px, 2vw, 20px) auto;
            width: 100%;
            max-width: 980px;
            box-shadow: 0 18px 40px rgba(16, 24, 40, 0.08);
        }

        .tm-demo-shell .tm-page {
            display: flex;
            flex-direction: column;
            gap: clamp(18px, 3vw, 28px);
        }

        .tm-demo-shell .tm-container {
            background: white;
            border-radius: clamp(12px, 2vw, 18px);
            border: 1px solid rgba(21, 101, 192, 0.1);
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
            width: 100%;
            overflow: visible;
            max-height: 95vh;
            display: flex;
            flex-direction: column;
        }

        .tm-demo-shell .tm-header {
            background: linear-gradient(135deg, #1565c0 0%, #1e88e5 100%);
            color: white;
            padding: clamp(15px, 5vw, 30px);
            flex-shrink: 0;
            border-radius: clamp(12px, 2vw, 18px) clamp(12px, 2vw, 18px) 0 0;
        }

        .tm-demo-shell .tm-header p {
            font-size: clamp(14px, 2.8vw, 18px);
            line-height: 1.5;
            opacity: 0.96;
        }

        .tm-demo-shell .tm-content {
            padding: clamp(15px, 4vw, 40px);
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .tm-demo-shell .tm-progress-bar {
            width: 100%;
            height: clamp(2px, 1vw, 4px);
            background: #d7e3f1;
            border-radius: 2px;
            margin-bottom: clamp(15px, 3vw, 30px);
            overflow: hidden;
        }

        .tm-demo-shell .tm-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #1565c0 0%, #42a5f5 100%);
            width: 0%;
            transition: width 0.3s ease;
        }

        .tm-demo-shell .tm-video-container {
            background: #000;
            border-radius: clamp(6px, 1.5vw, 8px);
            overflow: hidden;
            margin-bottom: clamp(15px, 3vw, 30px);
            aspect-ratio: 16/9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            width: 100%;
        }

        .tm-demo-shell .tm-video-container video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .tm-demo-shell .tm-no-video {
            color: #999;
            font-size: clamp(13px, 2.5vw, 16px);
            text-align: center;
            padding: clamp(10px, 3vw, 20px);
        }

        .tm-demo-shell .tm-file-input-section {
            margin-bottom: clamp(15px, 3vw, 30px);
            padding: clamp(12px, 2.5vw, 20px);
            background: #f7fafc;
            border-radius: clamp(6px, 1.5vw, 8px);
            text-align: center;
            display: none;
            border: 1px dashed rgba(21, 101, 192, 0.24);
        }

        .tm-demo-shell .tm-file-input-section.show {
            display: block;
        }

        .tm-demo-shell .tm-file-input-section label {
            display: inline-block;
            padding: clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px);
            background: #1565c0;
            color: white;
            border-radius: clamp(4px, 1vw, 6px);
            cursor: pointer;
            font-size: clamp(12px, 2.5vw, 14px);
            transition: background 0.3s ease;
            user-select: none;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tm-demo-shell .tm-file-input-section label:hover {
            background: #0d47a1;
        }

        .tm-demo-shell .tm-file-input-section input[type="file"] {
            display: none;
        }

        .tm-demo-shell .tm-files-list {
            margin-top: clamp(10px, 2vw, 15px);
            max-height: 200px;
            overflow-y: auto;
        }

        .tm-demo-shell .tm-file-item {
            padding: clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px);
            background: white;
            border: 1px solid #d7e3f1;
            border-radius: clamp(3px, 1vw, 4px);
            margin-bottom: clamp(6px, 1vw, 8px);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: clamp(11px, 2vw, 13px);
            word-break: break-word;
        }

        .tm-demo-shell .tm-file-item.current {
            background: #edf5ff;
            border-color: #1565c0;
        }

        .tm-demo-shell .tm-file-remove {
            cursor: pointer;
            color: #f44336;
            font-weight: bold;
            padding: clamp(4px, 1vw, 6px);
            flex-shrink: 0;
            margin-left: clamp(8px, 2vw, 12px);
            min-width: 20px;
            text-align: center;
        }

        .tm-demo-shell .tm-button-group {
            display: flex;
            gap: clamp(10px, 2vw, 15px);
            justify-content: center;
            margin-bottom: clamp(15px, 3vw, 30px);
            flex-wrap: wrap;
            width: 100%;
        }

        .tm-demo-shell .tm-review-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: clamp(4px, 1vw, 8px);
            padding: clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 24px);
            border: clamp(1px, 0.5vw, 2px) solid #e0e0e0;
            border-radius: clamp(6px, 1.5vw, 8px);
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: clamp(10px, 2vw, 13px);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            flex: 1;
            min-width: clamp(70px, 25vw, 120px);
            min-height: 44px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .tm-demo-shell .tm-review-button:active {
            transform: scale(0.95);
        }

        @media (hover: hover) {
            .tm-demo-shell .tm-review-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
        }

        .tm-demo-shell .tm-review-button.approve {
            border-color: #4caf50;
            color: #4caf50;
        }

        .tm-demo-shell .tm-review-button.approve:hover {
            background: #f1f8e9;
        }

        .tm-demo-shell .tm-review-button.warning {
            border-color: #f59e0b;
            color: #b45309;
        }

        .tm-demo-shell .tm-review-button.warning:hover {
            background: #fff7e8;
        }

        .tm-demo-shell .tm-review-button.alert {
            border-color: #f44336;
            color: #f44336;
        }

        .tm-demo-shell .tm-review-button.alert:hover {
            background: #ffebee;
        }

        .tm-demo-shell .tm-icon {
            font-size: clamp(24px, 5vw, 32px);
        }

        .tm-demo-shell .tm-modal-overlay {
            display: none !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.5) !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            pointer-events: all !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
        }

        .tm-demo-shell .tm-modal-overlay.active {
            display: flex !important;
        }

        .tm-demo-shell .tm-modal {
            background: white !important;
            border-radius: 16px !important;
            border: 1px solid rgba(21, 101, 192, 0.12) !important;
            padding: 30px !important;
            max-width: 500px !important;
            width: 85vw !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
            position: relative !important;
            z-index: 1000000 !important;
            pointer-events: all !important;
            margin: auto !important;
        }

        .tm-demo-shell .tm-modal h2 {
            font-size: clamp(16px, 4vw, 20px);
            margin-bottom: clamp(12px, 2.5vw, 20px);
            color: #333;
        }

        .tm-demo-shell .tm-modal h3 {
            font-size: clamp(11px, 2.5vw, 14px);
            font-weight: 600;
            margin-top: clamp(12px, 2.5vw, 20px);
            margin-bottom: clamp(8px, 2vw, 12px);
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .tm-demo-shell .tm-checkbox-group {
            display: flex;
            flex-direction: column;
            gap: clamp(8px, 1.5vw, 12px);
            margin-bottom: clamp(12px, 2vw, 20px);
        }

        .tm-demo-shell .tm-checkbox-item {
            display: flex;
            align-items: center;
            gap: clamp(6px, 1.5vw, 10px);
        }

        .tm-demo-shell .tm-checkbox-item input[type="checkbox"] {
            width: clamp(16px, 4vw, 18px);
            height: clamp(16px, 4vw, 18px);
            cursor: pointer;
            accent-color: #1565c0;
            flex-shrink: 0;
            min-width: 18px;
        }

        .tm-demo-shell .tm-checkbox-item label {
            cursor: pointer;
            font-size: clamp(12px, 2.5vw, 14px);
            color: #333;
            flex: 1;
        }

        .tm-demo-shell textarea {
            width: 100%;
            padding: clamp(8px, 2vw, 12px);
            border: 1px solid #d7e3f1;
            border-radius: clamp(4px, 1vw, 6px);
            font-family: inherit;
            font-size: clamp(12px, 2.5vw, 13px);
            resize: vertical;
            min-height: clamp(80px, 20vw, 100px);
            margin-bottom: clamp(12px, 2vw, 20px);
        }

        .tm-demo-shell textarea:focus {
            outline: none;
            border-color: #1565c0;
            box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.12);
        }

        .tm-demo-shell .tm-modal-buttons {
            display: flex;
            gap: clamp(6px, 2vw, 10px);
            justify-content: flex-end;
            flex-wrap: wrap;
        }

        .tm-demo-shell .tm-btn {
            padding: clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px);
            border: none;
            border-radius: clamp(4px, 1vw, 6px);
            cursor: pointer;
            font-size: clamp(12px, 2.5vw, 14px);
            font-weight: 600;
            transition: all 0.3s ease;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tm-demo-shell .tm-btn-cancel {
            background: #e0e0e0;
            color: #333;
        }

        .tm-demo-shell .tm-btn-cancel:active {
            background: #d0d0d0;
        }

        @media (hover: hover) {
            .tm-demo-shell .tm-btn-cancel:hover {
                background: #d0d0d0;
            }
        }

        .tm-demo-shell .tm-btn-submit {
            background: linear-gradient(135deg, #1565c0 0%, #1e88e5 100%);
            color: white;
        }

        .tm-demo-shell .tm-btn-submit:active {
            transform: scale(0.95);
        }

        @media (hover: hover) {
            .tm-demo-shell .tm-btn-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
            }
        }

        .tm-demo-shell .tm-status-message {
            text-align: center;
            padding: clamp(12px, 2.5vw, 20px);
            border-radius: clamp(6px, 1.5vw, 8px);
            margin-bottom: clamp(12px, 2vw, 20px);
            display: none;
            font-size: clamp(12px, 2.5vw, 14px);
        }

        .tm-demo-shell .tm-status-message.show {
            display: block;
        }

        .tm-demo-shell .tm-status-message.success {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .tm-demo-shell .tm-status-message.error {
            background: #ffebee;
            color: #c62828;
        }

        .tm-demo-shell .tm-clip-counter {
            text-align: center;
            color: #666;
            font-size: clamp(12px, 2.5vw, 14px);
            margin-top: clamp(8px, 1.5vw, 10px);
        }

        @media (max-width: 600px) {
            .tm-demo-shell .tm-content {
                padding: clamp(12px, 3vw, 20px);
            }

            .tm-demo-shell {
                padding: 12px;
            }
        }
</style>
<div class="tm-demo-shell">
    <div class="tm-page">
    <div class="tm-container">
        <div class="tm-header">
            <p>Video review and categorization demo for screening short therapy clips for possible misconduct concerns.</p>
        </div>

        <div class="tm-content">
            <div class="tm-progress-bar">
                <div class="tm-progress-fill" id="tmProgressBar"></div>
            </div>

            <div class="tm-file-input-section" id="tmFileInputSection">
                <label for="videoUpload">📁 Select Video Clips (Multiple)</label>
                <input type="file" id="videoUpload" multiple accept="video/*">
                <div class="tm-files-list" id="tmFilesList"></div>
            </div>

            <div class="tm-status-message show" id="tmLoadingMessage">Loading therapy clips...</div>
            <div class="tm-status-message" id="tmStatusMessage"></div>

            <div class="tm-video-container" id="tmVideoContainer">
                <div class="tm-no-video">Loading...</div>
            </div>

            <div class="tm-button-group">
                <button class="tm-review-button approve" onclick="submitReview('approve')">
                    <span class="tm-icon">✓</span>
                    <span>No Misconduct</span>
                </button>
                <button class="tm-review-button warning" onclick="submitReview('warning')">
                    <span class="tm-icon">⚠️</span>
                    <span>Possible Issue</span>
                </button>
                <button class="tm-review-button alert" onclick="submitReview('alert')">
                    <span class="tm-icon">🚨</span>
                    <span>Suspected Misconduct</span>
                </button>
            </div>

            <div class="tm-clip-counter" id="tmClipCounter"></div>
        </div>
    </div>

    <!-- Modal for misconduct details -->
    <div class="tm-modal-overlay" id="tmModalOverlay" aria-hidden="true">
        <div class="tm-modal" role="dialog" aria-modal="true" aria-labelledby="tmModalTitle">
            <h2 id="tmModalTitle">Report Issue Details</h2>

            <div>
                <h3>Type of Concern</h3>
                <div class="tm-checkbox-group">
                    <div class="tm-checkbox-item">
                        <input type="checkbox" id="misconduct-touch" value="inappropriate-touch">
                        <label for="misconduct-touch">Inappropriate Touch</label>
                    </div>
                    <div class="tm-checkbox-item">
                        <input type="checkbox" id="misconduct-boundary" value="boundary-violation">
                        <label for="misconduct-boundary">Boundary Violation</label>
                    </div>
                    <div class="tm-checkbox-item">
                        <input type="checkbox" id="misconduct-language" value="inappropriate-language">
                        <label for="misconduct-language">Inappropriate Language/Comments</label>
                    </div>
                    <div class="tm-checkbox-item">
                        <input type="checkbox" id="misconduct-neglect" value="neglect">
                        <label for="misconduct-neglect">Apparent Neglect or Inattention</label>
                    </div>
                    <div class="tm-checkbox-item">
                        <input type="checkbox" id="misconduct-privacy" value="privacy-violation">
                        <label for="misconduct-privacy">Privacy/Confidentiality Concern</label>
                    </div>
                    <div class="tm-checkbox-item">
                        <input type="checkbox" id="misconduct-other" value="other-concern">
                        <label for="misconduct-other">Other Concern</label>
                    </div>
                </div>
            </div>

            <h3>Additional Notes</h3>
            <textarea id="notesTextarea" placeholder="Provide any additional context or observations..."></textarea>

            <div class="tm-modal-buttons">
                <button class="tm-btn tm-btn-cancel" onclick="closeModal()">Cancel</button>
                <button class="tm-btn tm-btn-submit" onclick="submitIssueReport()">Submit & Next</button>
            </div>
        </div>
    </div>
</div>
</div>

<script>
        let videoFiles = [];
        let currentClipIndex = 0;
        let pendingReviewType = null;

        const videoContainer = document.getElementById('tmVideoContainer');
        const filesList = document.getElementById('tmFilesList');
        const progressBar = document.getElementById('tmProgressBar');
        const statusMessage = document.getElementById('tmStatusMessage');
        const loadingMessage = document.getElementById('tmLoadingMessage');
        const clipCounter = document.getElementById('tmClipCounter');
        const videoUpload = document.getElementById('videoUpload');
        const modalOverlay = document.getElementById('tmModalOverlay');
        const fileInputSection = document.getElementById('tmFileInputSection');

        // Auto-load clips on page load
        window.addEventListener('load', () => {
            autoLoadClips();
        });

        // Handle file selection fallback
        videoUpload.addEventListener('change', (e) => {
            videoFiles = Array.from(e.target.files);
            currentClipIndex = 0;
            loadingMessage.classList.remove('show');
            updateFilesList();
            loadClip();
        });

        async function autoLoadClips() {
            loadingMessage.classList.add('show');
            
            // For web-served version, use relative paths that work on brianwinston.com
            const knownFiles = [
                '7200768-uhd_3840_2160_25fps.mp4',
                '7423853-uhd_3840_2160_30fps.mp4',
                '8428655-uhd_3840_2160_25fps.mp4'
            ];
            
            // Try relative paths (works when deployed on web server or with hugo server)
            const pathVariations = [
                '/uploads/therapy_clips/',
                './uploads/therapy_clips/',
                '../static/uploads/therapy_clips/',
            ];
            
            for (const basePath of pathVariations) {
                try {
                    console.log('Trying path:', basePath);
                    const videoUrls = knownFiles.map(filename => basePath + filename);
                    
                    // Test if first file is accessible
                    const testResponse = await fetch(videoUrls[0]);
                    if (!testResponse.ok) continue;
                    
                    console.log('Found videos:', videoUrls);
                    await loadVideosFromUrls(videoUrls);
                    loadingMessage.classList.remove('show');
                    return;
                } catch (e) {
                    console.log('Path failed:', basePath, e.message);
                }
            }

            // Fallback: show file picker
                loadingMessage.textContent = 'For local testing: drag & drop video files, or use "hugo server" to preview with auto-loaded videos.';
                loadingMessage.classList.add('show');
                fileInputSection.classList.add('show');
        }

        async function loadVideosFromUrls(urls) {
            videoFiles = [];
            for (const url of urls) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const blob = await response.blob();
                        const filename = url.split('/').pop() || 'clip.mp4';
                        const file = new File([blob], filename, { type: blob.type });
                        videoFiles.push(file);
                        console.log('Loaded:', filename);
                    }
                } catch (e) {
                    console.error('Failed to load:', url, e);
                }
            }

            if (videoFiles.length > 0) {
                currentClipIndex = 0;
                updateFilesList();
                loadClip();
            } else {
                loadingMessage.textContent = 'No video files found. Please select files manually.';
                loadingMessage.classList.add('show');
                fileInputSection.classList.add('show');
            }
        }

        function updateFilesList() {
            filesList.innerHTML = '';
            videoFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = `tm-file-item ${index === currentClipIndex ? 'current' : ''}`;
                const filename = file.name || file.filename || 'video.mp4';
                fileItem.innerHTML = `
                    <span>${index + 1}. ${filename}</span>
                    <span class="tm-file-remove" onclick="removeFile(${index})">✕</span>
                `;
                filesList.appendChild(fileItem);
            });
        }

        function removeFile(index) {
            videoFiles.splice(index, 1);
            if (currentClipIndex >= videoFiles.length && currentClipIndex > 0) {
                currentClipIndex--;
            }
            updateFilesList();
            loadClip();
        }

        function loadClip() {
            if (videoFiles.length === 0) {
                videoContainer.innerHTML = '<div class="tm-no-video">Select video files to begin review</div>';
                clipCounter.textContent = '';
                progressBar.style.width = '0%';
                return;
            }

            const file = videoFiles[currentClipIndex];
            const url = URL.createObjectURL(file);
            videoContainer.innerHTML = `<video controls><source src="${url}" type="${file.type}"></video>`;
            
            updateProgress();
            updateFilesList();
            updateClipCounter();
        }

        function updateProgress() {
            if (videoFiles.length > 0) {
                const progress = ((currentClipIndex + 1) / videoFiles.length) * 100;
                progressBar.style.width = progress + '%';
            }
        }

        function updateClipCounter() {
            if (videoFiles.length > 0) {
                clipCounter.textContent = `Clip ${currentClipIndex + 1} of ${videoFiles.length}`;
            }
        }

        function submitReview(type) {
            if (videoFiles.length === 0) {
                showMessage('Please select video files first', 'error');
                return;
            }

            if (type === 'approve') {
                // Auto-advance without dialog
                nextClip();
                showMessage('✓ Marked as no misconduct', 'success');
            } else {
                // Show modal for warning or alert
                pendingReviewType = type;
                const modalTitle = type === 'warning' ? 'Report Possible Issue' : 'Report Suspected Misconduct';
                document.getElementById('tmModalTitle').textContent = modalTitle;
                clearModalForm();
                openModal();
            }
        }

        function openModal() {
            modalOverlay.classList.add('active');
            modalOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modalOverlay.classList.remove('active');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            clearModalForm();
            pendingReviewType = null;
        }

        function clearModalForm() {
            modalOverlay.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.getElementById('notesTextarea').value = '';
        }

        function submitIssueReport() {
            const selectedTypes = Array.from(modalOverlay.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            const notes = document.getElementById('notesTextarea').value;

            if (selectedTypes.length === 0 && !notes.trim()) {
                showMessage('Please select at least one concern type or add notes', 'error');
                return;
            }

            // Log the report (in a real app, this would send to a backend)
            console.log({
                clip: videoFiles[currentClipIndex].name || videoFiles[currentClipIndex].filename,
                reviewType: pendingReviewType,
                concerns: selectedTypes,
                notes: notes,
                timestamp: new Date().toISOString()
            });

            const severity = pendingReviewType === 'warning' ? '⚠️ Flagged as possible issue' : '🚨 Flagged as suspected misconduct';
            showMessage(severity, 'success');

            closeModal();
            setTimeout(() => nextClip(), 500);
        }

        function nextClip() {
            if (videoFiles.length > 0) {
                if (currentClipIndex < videoFiles.length - 1) {
                    currentClipIndex++;
                    loadClip();
                } else {
                    showMessage('✓ Review Complete! All clips processed.', 'success');
                    setTimeout(() => {
                        videoContainer.innerHTML = '<div class="tm-no-video">All clips reviewed!</div>';
                        updateFilesList();
                    }, 1500);
                }
            }
        }

        function showMessage(message, type) {
            statusMessage.textContent = message;
            statusMessage.className = `tm-status-message show ${type}`;
            setTimeout(() => {
                statusMessage.classList.remove('show');
            }, 3000);
        }

        // Close modal on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
</script>
{{< /rawhtml >}}
