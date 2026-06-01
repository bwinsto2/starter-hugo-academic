---
title: "Therapist Misconduct Monitoring - Demo"
date: 2024-01-01
type: docs
---

{{< rawhtml >}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Therapist Misconduct Review Interface</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 900px;
            width: 100%;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .content {
            padding: 40px;
        }

        .progress-bar {
            width: 100%;
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            margin-bottom: 30px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s ease;
        }

        .video-container {
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 30px;
            aspect-ratio: 16/9;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .video-container video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .no-video {
            color: #999;
            font-size: 16px;
            text-align: center;
        }

        .file-input-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
            text-align: center;
        }

        .file-input-section label {
            display: inline-block;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s ease;
        }

        .file-input-section label:hover {
            background: #764ba2;
        }

        .file-input-section input[type="file"] {
            display: none;
        }

        .files-list {
            margin-top: 15px;
            max-height: 200px;
            overflow-y: auto;
        }

        .file-item {
            padding: 8px 12px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        }

        .file-item.current {
            background: #e3f2fd;
            border-color: #667eea;
        }

        .file-remove {
            cursor: pointer;
            color: #f44336;
            font-weight: bold;
            padding: 0 6px;
        }

        .button-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 30px;
        }

        .review-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px 24px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .review-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .review-button.approve {
            border-color: #4caf50;
            color: #4caf50;
        }

        .review-button.approve:hover {
            background: #f1f8e9;
        }

        .review-button.warning {
            border-color: #ff9800;
            color: #ff9800;
        }

        .review-button.warning:hover {
            background: #fff3e0;
        }

        .review-button.alert {
            border-color: #f44336;
            color: #f44336;
        }

        .review-button.alert:hover {
            background: #ffebee;
        }

        .icon {
            font-size: 32px;
        }

        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal h2 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #333;
        }

        .modal h3 {
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            margin-bottom: 12px;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .checkbox-item input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #667eea;
        }

        .checkbox-item label {
            cursor: pointer;
            font-size: 14px;
            color: #333;
            flex: 1;
        }

        textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            font-family: inherit;
            font-size: 13px;
            resize: vertical;
            min-height: 100px;
            margin-bottom: 20px;
        }

        textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn-cancel {
            background: #e0e0e0;
            color: #333;
        }

        .btn-cancel:hover {
            background: #d0d0d0;
        }

        .btn-submit {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .status-message {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }

        .status-message.show {
            display: block;
        }

        .status-message.success {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .status-message.error {
            background: #ffebee;
            color: #c62828;
        }

        .clip-counter {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 10px;
        }

        @media (max-width: 600px) {
            .content {
                padding: 20px;
            }

            .button-group {
                flex-wrap: wrap;
            }

            .review-button {
                flex: 1;
                min-width: 100px;
            }

            .modal {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Therapist Misconduct Review Interface</h1>
            <p>Demo - Video Review and Categorization System</p>
        </div>

        <div class="content">
            <div class="progress-bar">
                <div class="progress-fill" id="progressBar"></div>
            </div>

            <div class="file-input-section">
                <label for="videoUpload">📁 Select Video Clips (Multiple)</label>
                <input type="file" id="videoUpload" multiple accept="video/*">
                <div class="files-list" id="filesList"></div>
            </div>

            <div class="status-message" id="statusMessage"></div>

            <div class="video-container" id="videoContainer">
                <div class="no-video">Select video files to begin review</div>
            </div>

            <div class="button-group">
                <button class="review-button approve" onclick="submitReview('approve')">
                    <span class="icon">✓</span>
                    <span>No Misconduct</span>
                </button>
                <button class="review-button warning" onclick="submitReview('warning')">
                    <span class="icon">⚠️</span>
                    <span>Possible Issue</span>
                </button>
                <button class="review-button alert" onclick="submitReview('alert')">
                    <span class="icon">🚨</span>
                    <span>Suspected Misconduct</span>
                </button>
            </div>

            <div class="clip-counter" id="clipCounter"></div>
        </div>
    </div>

    <!-- Modal for misconduct details -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal">
            <h2 id="modalTitle">Report Issue Details</h2>

            <div>
                <h3>Type of Concern</h3>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="misconduct-touch" value="inappropriate-touch">
                        <label for="misconduct-touch">Inappropriate Touch</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="misconduct-boundary" value="boundary-violation">
                        <label for="misconduct-boundary">Boundary Violation</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="misconduct-language" value="inappropriate-language">
                        <label for="misconduct-language">Inappropriate Language/Comments</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="misconduct-neglect" value="neglect">
                        <label for="misconduct-neglect">Apparent Neglect or Inattention</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="misconduct-privacy" value="privacy-violation">
                        <label for="misconduct-privacy">Privacy/Confidentiality Concern</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="misconduct-other" value="other-concern">
                        <label for="misconduct-other">Other Concern</label>
                    </div>
                </div>
            </div>

            <h3>Additional Notes</h3>
            <textarea id="notesTextarea" placeholder="Provide any additional context or observations..."></textarea>

            <div class="modal-buttons">
                <button class="btn btn-cancel" onclick="closeModal()">Cancel</button>
                <button class="btn btn-submit" onclick="submitIssueReport()">Submit & Next</button>
            </div>
        </div>
    </div>

    <script>
        let videoFiles = [];
        let currentClipIndex = 0;
        let pendingReviewType = null;

        const videoContainer = document.getElementById('videoContainer');
        const filesList = document.getElementById('filesList');
        const progressBar = document.getElementById('progressBar');
        const statusMessage = document.getElementById('statusMessage');
        const clipCounter = document.getElementById('clipCounter');
        const videoUpload = document.getElementById('videoUpload');
        const modalOverlay = document.getElementById('modalOverlay');

        // Handle file selection
        videoUpload.addEventListener('change', (e) => {
            videoFiles = Array.from(e.target.files);
            currentClipIndex = 0;
            updateFilesList();
            loadClip();
        });

        function updateFilesList() {
            filesList.innerHTML = '';
            videoFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = `file-item ${index === currentClipIndex ? 'current' : ''}`;
                fileItem.innerHTML = `
                    <span>${index + 1}. ${file.name}</span>
                    <span class="file-remove" onclick="removeFile(${index})">✕</span>
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
                videoContainer.innerHTML = '<div class="no-video">Select video files to begin review</div>';
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
                document.getElementById('modalTitle').textContent = modalTitle;
                clearModalForm();
                openModal();
            }
        }

        function openModal() {
            modalOverlay.classList.add('active');
        }

        function closeModal() {
            modalOverlay.classList.remove('active');
            clearModalForm();
            pendingReviewType = null;
        }

        function clearModalForm() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.getElementById('notesTextarea').value = '';
        }

        function submitIssueReport() {
            const selectedTypes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            const notes = document.getElementById('notesTextarea').value;

            if (selectedTypes.length === 0 && !notes.trim()) {
                showMessage('Please select at least one concern type or add notes', 'error');
                return;
            }

            // Log the report (in a real app, this would send to a backend)
            console.log({
                clip: videoFiles[currentClipIndex].name,
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
                        videoContainer.innerHTML = '<div class="no-video">All clips reviewed!</div>';
                        updateFilesList();
                    }, 1500);
                }
            }
        }

        function showMessage(message, type) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message show ${type}`;
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
</body>
</html>
{{< /rawhtml >}}
